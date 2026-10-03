import { useEffect, useState } from "react";

// Mirrors the shape returned by GET /api/candidates (backend/src/candidates.ts)
// for the fields this list actually renders. `summary` is intentionally left
// out — the requirements doc (cadastro-de-candidatos.md, requisito funcional
// 7) reserves the full record, including `summary`, for the detail screen.
export type CandidateListItem = {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  areaOfInterest?: string | null;
  createdAt?: string;
};

// Vite exposes build-time env vars via import.meta.env; VITE_API_URL lets
// the API base be configured per environment without hardcoding it (mirrors
// CandidateForm.tsx, ticket 009). Falls back to the local backend dev port
// when unset.
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

type Status = "loading" | "error" | "loaded";

export type CandidateListProps = {
  // Called when the user picks a row's "Ver detalhes" action, with that
  // candidate's id. The shell (ticket 008) uses this to switch to the detail
  // view (ticket 011).
  onSelectCandidate: (id: number) => void;
};

export function CandidateList({ onSelectCandidate }: CandidateListProps) {
  const [status, setStatus] = useState<Status>("loading");
  const [candidates, setCandidates] = useState<CandidateListItem[]>([]);

  useEffect(() => {
    // Guards state updates after unmount — not expected in this single-view
    // shell, but cheap insurance against a "setState on unmounted component"
    // warning if the list is ever unmounted mid-request.
    let isMounted = true;

    async function loadCandidates() {
      setStatus("loading");

      try {
        const response = await fetch(`${API_BASE_URL}/api/candidates`);
        const body = await response.json().catch(() => null);

        if (response.status !== 200) {
          if (isMounted) {
            setStatus("error");
          }
          return;
        }

        if (isMounted) {
          setCandidates(body?.data ?? []);
          setStatus("loaded");
        }
      } catch {
        // Network failure (server down, offline, etc.) — never leave the
        // list stuck or crash the page; show a clear message instead
        // (docs/requirements/cadastro-de-candidatos.md, requisito funcional 9).
        if (isMounted) {
          setStatus("error");
        }
      }
    }

    loadCandidates();

    return () => {
      isMounted = false;
    };
  }, []);

  if (status === "loading") {
    return <p>Carregando candidatos...</p>;
  }

  if (status === "error") {
    return (
      <p role="alert">
        Não foi possível carregar os candidatos. Tente novamente mais tarde.
      </p>
    );
  }

  if (candidates.length === 0) {
    return <p>Nenhum candidato cadastrado ainda.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Nome</th>
          <th>E-mail</th>
          <th>Telefone</th>
          <th>Área de interesse</th>
          <th aria-hidden="true" />
        </tr>
      </thead>
      <tbody>
        {candidates.map((candidate) => (
          <tr key={candidate.id}>
            <td>{candidate.fullName}</td>
            <td>{candidate.email}</td>
            <td>{candidate.phone || "-"}</td>
            <td>{candidate.areaOfInterest || "-"}</td>
            <td>
              <button type="button" onClick={() => onSelectCandidate(candidate.id)}>
                Ver detalhes
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
