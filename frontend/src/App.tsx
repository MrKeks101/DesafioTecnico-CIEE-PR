import { useState } from "react";
import "./App.css";
import { CandidateDetailView } from "./views/CandidateDetailView";
import { CandidateFormView } from "./views/CandidateFormView";
import { CandidateListView } from "./views/CandidateListView";

// Navigation is state-based, not URL-based: no router dependency is
// installed in the scaffold, and the kickoff scope decided against adding
// new dependencies for this (see "Navegação do frontend" in
// docs/requirements/cadastro-de-candidatos.md). Revisit with react-router
// only if there's time left for polish.
type View = { name: "form" } | { name: "list" } | { name: "detail"; id: number };

function App() {
  const [view, setView] = useState<View>({ name: "form" });

  return (
    <>
      <header>
        <nav aria-label="Navegação principal">
          <button
            type="button"
            aria-current={view.name === "form" ? "page" : undefined}
            onClick={() => setView({ name: "form" })}
          >
            Novo cadastro
          </button>
          <button
            type="button"
            aria-current={view.name === "list" ? "page" : undefined}
            onClick={() => setView({ name: "list" })}
          >
            Candidatos
          </button>
        </nav>
      </header>

      <main>
        {view.name === "form" && <CandidateFormView />}
        {view.name === "list" && (
          <CandidateListView
            onSelectCandidate={(id) => setView({ name: "detail", id })}
          />
        )}
        {view.name === "detail" && (
          <CandidateDetailView
            id={view.id}
            onBack={() => setView({ name: "list" })}
          />
        )}
      </main>
    </>
  );
}

export default App;
