type CandidateDetailViewProps = {
  id: number;
  onBack: () => void;
};

// Placeholder until ticket 011 (detalhe consumindo GET /api/candidates/:id).
export function CandidateDetailView({ id, onBack }: CandidateDetailViewProps) {
  return (
    <section aria-label="Detalhe do candidato">
      <h1>Detalhe do candidato</h1>
      <p>
        A tela de detalhe do candidato #{id} será implementada no ticket 011.
      </p>
      <button type="button" onClick={onBack}>
        Voltar para Candidatos
      </button>
    </section>
  );
}
