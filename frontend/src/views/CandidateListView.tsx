import { CandidateList } from "../CandidateList";

type CandidateListViewProps = {
  onSelectCandidate: (id: number) => void;
};

export function CandidateListView({ onSelectCandidate }: CandidateListViewProps) {
  return (
    <section aria-label="Candidatos">
      <h1>Candidatos</h1>
      <CandidateList onSelectCandidate={onSelectCandidate} />
    </section>
  );
}
