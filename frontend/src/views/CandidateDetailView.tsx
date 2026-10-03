import { CandidateDetail } from "../CandidateDetail";

type CandidateDetailViewProps = {
  id: number;
  onBack: () => void;
};

export function CandidateDetailView({ id, onBack }: CandidateDetailViewProps) {
  return (
    <section aria-label="Detalhe do candidato">
      <h1>Detalhe do candidato</h1>
      <CandidateDetail id={id} onBack={onBack} />
    </section>
  );
}
