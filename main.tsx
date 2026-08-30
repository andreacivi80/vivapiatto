import React, { Component, type ErrorInfo, type ReactNode } from "react";
import ReactDOM from "react-dom/client";
import "./app/globals.css";
import packageFile from "./package.json";
import { FoodPlanner } from "./app/FoodPlanner";
import {
  browserLocalStorage,
  browserSessionStorage,
  quarantineSavedState,
  readSessionItem,
  removeSessionItem,
  writeSessionItem,
} from "./app/storageRecovery";

type AppGuardState = { failed: boolean; recoveryKey: number };

const recoveryHref = () =>
  `${import.meta.env.BASE_URL}recover.html?from=${encodeURIComponent(packageFile.version)}&time=${Date.now()}`;

const startUrl = new URL(window.location.href);
if (startUrl.searchParams.get("_safe_start") === "1") {
  // Recovery must happen before React mounts. Waiting for a component effect
  // is too late when a legacy persisted value can crash the first render.
  quarantineSavedState(browserLocalStorage());
}

class AppGuard extends Component<{ children: ReactNode }, AppGuardState> {
  state: AppGuardState = { failed: false, recoveryKey: 0 };
  private releaseTimer?: number;
  private stableTimer?: number;
  private inPlaceRecoveryAttempted = false;

  static getDerivedStateFromError(): AppGuardState {
    return { failed: true, recoveryKey: 0 };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Tavola Mia: errore di rendering recuperabile", error, info);
    if (!this.inPlaceRecoveryAttempted) {
      this.inPlaceRecoveryAttempted = true;
      quarantineSavedState(browserLocalStorage());
      const session = browserSessionStorage();
      removeSessionItem(session, "vivapiatto-safe-recovery-attempted");
      removeSessionItem(session, "vivapiatto-release-target");
      removeSessionItem(session, "vivapiatto-release-scroll-y");
      writeSessionItem(session, "vivapiatto-safe-recovery-attempted", packageFile.version);
      // Recover in this document first. This avoids a redirect loop when a
      // browser keeps an older document or refuses the standalone redirect.
      // FoodPlanner sees _safe_start before reading any persisted state.
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.set("_safe_start", "1");
      cleanUrl.searchParams.set("_safe_recovery", `${packageFile.version}-${Date.now()}`);
      window.history.replaceState(window.history.state, "", cleanUrl.toString());
      window.setTimeout(() => {
        this.setState(({ recoveryKey }) => ({
          failed: false,
          recoveryKey: recoveryKey + 1,
        }));
      }, 0);
      return;
    }
    const alreadyAttempted =
      readSessionItem(browserSessionStorage(), "vivapiatto-safe-recovery-attempted") === packageFile.version;
    if (!alreadyAttempted) {
      quarantineSavedState(browserLocalStorage());
      writeSessionItem(browserSessionStorage(), "vivapiatto-safe-recovery-attempted", packageFile.version);
      window.setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.set("_safe_start", "1");
        url.searchParams.set("_safe_recovery", `${packageFile.version}-${Date.now()}`);
        window.location.replace(url.toString());
      }, 250);
    }
  }

  private checkRecoveryRelease = async () => {
    if (!this.state.failed) return;
    try {
      const response = await fetch(`./version.json?recovery=${Date.now()}`, { cache: "no-store" });
      const release = (await response.json()) as { version?: string };
      const current = packageFile.version.split(".").map(Number);
      const candidate = String(release.version || "").split(".").map(Number);
      const length = Math.max(current.length, candidate.length);
      const newer = Array.from({ length }).some((_, index) => {
        const before = candidate.slice(0, index).every((part, partIndex) => part === (current[partIndex] || 0));
        return before && (candidate[index] || 0) > (current[index] || 0);
      });
      if (newer) {
        const url = new URL(window.location.href);
        url.searchParams.set("_recovery_release", `${release.version}-${Date.now()}`);
        window.location.replace(url.toString());
      }
    } catch {
      // Il recupero resta visibile e riprova senza toccare i dati locali.
    }
  };

  componentDidMount() {
    this.releaseTimer = window.setInterval(this.checkRecoveryRelease, 5000);
    this.stableTimer = window.setTimeout(() => {
      if (!this.state.failed) removeSessionItem(browserSessionStorage(), "vivapiatto-safe-recovery-attempted");
    }, 4000);
  }

  componentWillUnmount() {
    if (this.releaseTimer) window.clearInterval(this.releaseTimer);
    if (this.stableTimer) window.clearTimeout(this.stableTimer);
  }

  private openCleanCopy = () => {
    // Use a dependency-free page. It can repair storage even when the React
    // bundle itself cannot complete a render in this browser.
    window.location.replace(recoveryHref());
  };

  render() {
    if (!this.state.failed) {
      return <React.Fragment key={this.state.recoveryKey}>{this.props.children}</React.Fragment>;
    }
    return (
      <main className="app-recovery" role="alert">
        <div className="app-recovery-card">
          <span className="app-recovery-mark">T</span>
          <h1>Riapriamo Tavola Mia</h1>
          <p>Un vecchio salvataggio non è compatibile. Ne conserviamo una copia e riapriamo l’app pulita.</p>
          <a className="app-recovery-action" href={recoveryHref()}>Riparti ora</a>
          <a className="app-recovery-action secondary" href={recoveryHref()}>
            Apri con copia di sicurezza
          </a>
          <small>Il piano non funzionante viene isolato e l'app riparte pulita.</small>
        </div>
      </main>
    );
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppGuard>
      <FoodPlanner />
    </AppGuard>
  </React.StrictMode>,
);
