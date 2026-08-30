import React, { Component, Suspense, lazy, type ErrorInfo, type ReactNode } from "react";
import ReactDOM from "react-dom/client";
import "./app/globals.css";
import packageFile from "./package.json";
import {
  quarantineSavedState,
  readSessionItem,
  removeSessionItem,
  writeSessionItem,
} from "./app/storageRecovery";

const FoodPlanner = lazy(() =>
  import("./app/FoodPlanner").then((module) => ({ default: module.FoodPlanner })),
);

type AppGuardState = { failed: boolean; recoveryKey: number };

class AppGuard extends Component<{ children: ReactNode }, AppGuardState> {
  state: AppGuardState = { failed: false, recoveryKey: 0 };
  private releaseTimer?: number;
  private stableTimer?: number;

  static getDerivedStateFromError(): AppGuardState {
    return { failed: true, recoveryKey: 0 };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Tavola Mia: errore di rendering recuperabile", error, info);
    const alreadyAttempted =
      readSessionItem(sessionStorage, "vivapiatto-safe-recovery-attempted") === packageFile.version;
    if (!alreadyAttempted && quarantineSavedState(localStorage)) {
      writeSessionItem(sessionStorage, "vivapiatto-safe-recovery-attempted", packageFile.version);
      window.setTimeout(() => {
        const url = new URL(window.location.href);
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
      if (!this.state.failed) removeSessionItem(sessionStorage, "vivapiatto-safe-recovery-attempted");
    }, 4000);
  }

  componentWillUnmount() {
    if (this.releaseTimer) window.clearInterval(this.releaseTimer);
    if (this.stableTimer) window.clearTimeout(this.stableTimer);
  }

  private restoreApp = () => {
    window.location.reload();
  };

  private resetSavedState = () => {
    quarantineSavedState(localStorage);
    removeSessionItem(sessionStorage, "vivapiatto-safe-recovery-attempted");
    removeSessionItem(sessionStorage, "vivapiatto-release-target");
    removeSessionItem(sessionStorage, "vivapiatto-release-scroll-y");
    this.setState((state) => ({
      failed: false,
      recoveryKey: state.recoveryKey + 1,
    }));
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
          <p>La pagina ha incontrato un errore. Prova prima a ricaricarla: i dati restano salvati.</p>
          <button type="button" onClick={this.restoreApp}>Ricarica app</button>
          <button type="button" className="secondary" onClick={this.resetSavedState}>
            Apri con copia di sicurezza
          </button>
          <small>Il piano non funzionante viene isolato e l'app riparte pulita.</small>
        </div>
      </main>
    );
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppGuard>
      <Suspense fallback={<main className="app-loading" aria-live="polite">Tavola Mia</main>}>
        <FoodPlanner />
      </Suspense>
    </AppGuard>
  </React.StrictMode>,
);
