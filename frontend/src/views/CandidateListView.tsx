type CandidateListViewProps = {
  onSelectCandidate: (id: number) => void;
};

// Placeholder until ticket 010 (listagem consumindo GET /api/candidates).
// The "Ver detalhe de exemplo" button exists only to exercise, in this
// shell, the navigation mechanism that ticket 010's real list items will
// use (selecting a candidate by id and switching to the detail view).
export function CandidateListView({ onSelectCandidate }: CandidateListViewProps) {
  return (
    <section aria-label="Candidatos">
      <h1>Candidatos</h1>
      <p>A listagem de candidatos será implementada no ticket 010.</p>
      <button type="button" onClick={() => onSelectCandidate(1)}>
        Ver detalhe de exemplo
      </button>
    </section>
  );
}
