import React, { Component, type ErrorInfo, type ReactNode } from "react";
import ReactDOM from "react-dom/client";
import { FoodPlanner } from "./app/FoodPlanner";
import "./app/globals.css";

type AppGuardState = { failed: boolean };

class AppGuard extends Component<{ children: ReactNode }, AppGuardState> {
  state: AppGuardState = { failed: false };

  static getDerivedStateFromError(): AppGuardState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Tavola Mia: errore di rendering recuperabile", error, info);
  }

  private restoreApp = () => {
    window.location.reload();
  };

  private resetSavedState = () => {
    const saved = localStorage.getItem("vivapiatto-v1");
    if (saved) localStorage.setItem("vivapiatto-recovery-backup", saved);
    localStorage.removeItem("vivapiatto-v1");
    sessionStorage.removeItem("vivapiatto-release-target");
    sessionStorage.removeItem("vivapiatto-release-scroll-y");
    window.location.reload();
  };

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="app-recovery" role="alert">
        <div className="app-recovery-card">
          <span className="app-recovery-mark">T</span>
          <h1>Riapriamo Tavola Mia</h1>
          <p>La pagina ha incontrato un errore. Prova prima a ricaricarla: i dati restano salvati.</p>
          <button type="button" onClick={this.restoreApp}>Ricarica app</button>
          <button type="button" className="secondary" onClick={this.resetSavedState}>
            Ripristina dati locali
          </button>
          <small>Prima del ripristino viene conservata una copia di recupero sul dispositivo.</small>
        </div>
      </main>
    );
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><AppGuard><FoodPlanner /></AppGuard></React.StrictMode>,
);
