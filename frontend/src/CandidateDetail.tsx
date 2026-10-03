import { useEffect, useState } from "react";

// Mirrors the full shape returned by GET /api/candidates/:id
// (backend/src/candidates.ts), including `summary` — the field the listing
// (CandidateList.tsx) intentionally omits and this screen exists to show
// (docs/requirements/cadastro-de-candidatos.md, requisito funcional 7).
export type Candidate = {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  areaOfInterest?: string | null;
  summary?: string | null;
  createdAt?: string;
};

// Vite exposes build-time env vars via import.meta.env; VITE_API_URL lets
// the API base be configured per environment without hardcoding it (mirrors
// CandidateForm.tsx/CandidateList.tsx, tickets 009/010). Falls back to the
// local backend dev port when unset.
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

type Status = "loading" | "notFound" | "error" | "loaded";

export type CandidateDetailProps = {
  // The candidate id to look up, provided by the shell (ticket 008) from the
  // row selected on the listing (ticket 010).
  id: number;
  // Called when the user picks "Voltar para a listagem". The shell (ticket
  // 008) uses this to switch back to the "list" view.
  onBack: () => void;
};

export function CandidateDetail({ id, onBack }: CandidateDetailProps) {
  const [status, setStatus] = useState<Status>("loading");
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [notFoundMessage, setNotFoundMessage] = useState<string>(
    "Candidato não encontrado.",
  );

  useEffect(() => {
    // Guards state updates after unmount/id change — cheap insurance against
    // a "setState on unmounted component" warning if a stale request
    // resolves after the id prop has already changed.
    let isMounted = true;

    async function loadCandidate() {
      setStatus("loading");

      try {
        const response = await fetch(`${API_BASE_URL}/api/candidates/${id}`);
        const body = await response.json().catch(() => null);

        if (response.status === 404) {
          if (isMounted) {
            setNotFoundMessage(body?.error?.message ?? "Candidato não encontrado.");
            setStatus("notFound");
          }
          return;
        }

        if (response.status !== 200) {
          if (isMounted) {
            setStatus("error");
          }
          return;
        }

        if (isMounted) {
          setCandidate(body?.data ?? null);
          setStatus("loaded");
        }
      } catch {
        // Network failure (server down, offline, etc.) — never leave the
        // screen stuck or crash the page; show a clear message instead
        // (docs/requirements/cadastro-de-candidatos.md, requisito funcional 9).
        if (isMounted) {
          setStatus("error");
        }
      }
    }

    loadCandidate();

    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <div>
      {status === "loading" && <p>Carregando candidato...</p>}

      {status === "notFound" && <p role="alert">{notFoundMessage}</p>}

      {status === "error" && (
        <p role="alert">
          Não foi possível carregar o candidato. Tente novamente mais tarde.
        </p>
      )}

      {status === "loaded" && candidate && (
        <dl>
          <div>
            <dt>Nome completo</dt>
            <dd>{candidate.fullName}</dd>
          </div>
          <div>
            <dt>E-mail</dt>
            <dd>{candidate.email}</dd>
          </div>
          <div>
            <dt>Telefone</dt>
            <dd>{candidate.phone || "-"}</dd>
          </div>
          <div>
            <dt>Área de interesse</dt>
            <dd>{candidate.areaOfInterest || "-"}</dd>
          </div>
          <div>
            <dt>Resumo profissional</dt>
            <dd>{candidate.summary || "-"}</dd>
          </div>
        </dl>
      )}

      <button type="button" onClick={onBack}>
        Voltar para a listagem
      </button>
    </div>
  );
}
