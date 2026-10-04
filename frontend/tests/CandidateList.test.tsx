import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CandidateList } from "../src/CandidateList";

const SAMPLE_CANDIDATES = [
  {
    id: 2,
    fullName: "Bruno Lima",
    email: "bruno.lima@example.com",
    phone: "(41) 98888-0000",
    areaOfInterest: "Suporte Técnico",
    createdAt: "2024-06-01T10:00:00.000Z",
  },
  {
    id: 1,
    fullName: "Ana Oliveira",
    email: "ana.oliveira@example.com",
    phone: null,
    areaOfInterest: null,
    createdAt: "2024-01-01T10:00:00.000Z",
  },
];

describe("CandidateList", () => {
  afterEach(() => {
    // Mirrors CandidateForm.test.tsx: undo vi.stubGlobal("fetch", ...) so
    // one test's mock never leaks into the next (afterEach(() => cleanup())
    // in setupTests.ts only unmounts the DOM, it doesn't touch stubbed
    // globals).
    vi.unstubAllGlobals();
  });

  it("shows a loading state before the response resolves", () => {
    // A promise that never resolves during this test keeps the component in
    // its initial loading state, so it can be asserted synchronously.
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));

    render(<CandidateList onSelectCandidate={vi.fn()} />);

    expect(screen.getByText("Carregando candidatos...")).toBeInTheDocument();
  });

  it("shows an empty-state message when the API returns an empty list", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        json: async () => ({ data: [] }),
      }),
    );

    render(<CandidateList onSelectCandidate={vi.fn()} />);

    expect(
      await screen.findByText("Nenhum candidato cadastrado ainda."),
    ).toBeInTheDocument();
  });

  it("shows a clear error message when the request rejects (network failure)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    render(<CandidateList onSelectCandidate={vi.fn()} />);

    expect(
      await screen.findByText(/Não foi possível carregar os candidatos/i),
    ).toBeInTheDocument();
  });

  it("shows a clear error message when the response status is not 2xx", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 500,
        json: async () => ({ error: { message: "Erro interno." } }),
      }),
    );

    render(<CandidateList onSelectCandidate={vi.fn()} />);

    expect(
      await screen.findByText(/Não foi possível carregar os candidatos/i),
    ).toBeInTheDocument();
  });

  it("renders one row per candidate with fullName, email, phone and areaOfInterest", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        json: async () => ({ data: SAMPLE_CANDIDATES }),
      }),
    );

    render(<CandidateList onSelectCandidate={vi.fn()} />);

    expect(await screen.findByText("Bruno Lima")).toBeInTheDocument();
    expect(screen.getByText("bruno.lima@example.com")).toBeInTheDocument();
    expect(screen.getByText("(41) 98888-0000")).toBeInTheDocument();
    expect(screen.getByText("Suporte Técnico")).toBeInTheDocument();

    expect(screen.getByText("Ana Oliveira")).toBeInTheDocument();
    expect(screen.getByText("ana.oliveira@example.com")).toBeInTheDocument();

    expect(
      screen.getAllByRole("button", { name: "Ver detalhes" }),
    ).toHaveLength(2);
  });

  it("calls onSelectCandidate with the correct id when 'Ver detalhes' is clicked", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        json: async () => ({ data: SAMPLE_CANDIDATES }),
      }),
    );
    const onSelectCandidate = vi.fn();

    render(<CandidateList onSelectCandidate={onSelectCandidate} />);

    const anaRow = (await screen.findByText("Ana Oliveira")).closest("tr") as HTMLElement;
    fireEvent.click(within(anaRow).getByRole("button", { name: "Ver detalhes" }));

    expect(onSelectCandidate).toHaveBeenCalledTimes(1);
    expect(onSelectCandidate).toHaveBeenCalledWith(1);
  });
});
