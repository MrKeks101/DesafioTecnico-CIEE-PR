import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CandidateDetail } from "./CandidateDetail";

const SAMPLE_CANDIDATE = {
  id: 7,
  fullName: "Carla Mendes",
  email: "carla.mendes@example.com",
  phone: "(41) 97777-0000",
  areaOfInterest: "Desenvolvimento de Software",
  summary: "Desenvolvedora com experiência em React e Node.js.",
  createdAt: "2024-06-01T10:00:00.000Z",
};

describe("CandidateDetail", () => {
  afterEach(() => {
    // Mirrors CandidateList.test.tsx: undo vi.stubGlobal("fetch", ...) so
    // one test's mock never leaks into the next (afterEach(() => cleanup())
    // in setupTests.ts only unmounts the DOM, it doesn't touch stubbed
    // globals).
    vi.unstubAllGlobals();
  });

  it("shows a loading state before the response resolves", () => {
    // A promise that never resolves during this test keeps the component in
    // its initial loading state, so it can be asserted synchronously.
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));

    render(<CandidateDetail id={7} onBack={vi.fn()} />);

    expect(screen.getByText("Carregando candidato...")).toBeInTheDocument();
  });

  it("renders every field, including summary, on a successful response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        json: async () => ({ data: SAMPLE_CANDIDATE }),
      }),
    );

    render(<CandidateDetail id={7} onBack={vi.fn()} />);

    expect(await screen.findByText("Carla Mendes")).toBeInTheDocument();
    expect(screen.getByText("carla.mendes@example.com")).toBeInTheDocument();
    expect(screen.getByText("(41) 97777-0000")).toBeInTheDocument();
    expect(screen.getByText("Desenvolvimento de Software")).toBeInTheDocument();
    expect(
      screen.getByText("Desenvolvedora com experiência em React e Node.js."),
    ).toBeInTheDocument();
  });

  it("falls back to a dash for optional fields the API returns as null", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        json: async () => ({
          data: {
            id: 8,
            fullName: "Ana Oliveira",
            email: "ana.oliveira@example.com",
            phone: null,
            areaOfInterest: null,
            summary: null,
          },
        }),
      }),
    );

    render(<CandidateDetail id={8} onBack={vi.fn()} />);

    expect(await screen.findByText("Ana Oliveira")).toBeInTheDocument();
    expect(screen.getAllByText("-")).toHaveLength(3);
  });

  it("shows a clear 'not found' message on a 404 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 404,
        json: async () => ({ error: { message: "Candidato não encontrado." } }),
      }),
    );

    render(<CandidateDetail id={999} onBack={vi.fn()} />);

    expect(
      await screen.findByText("Candidato não encontrado."),
    ).toBeInTheDocument();
  });

  it("shows a clear generic error message on a non-404, non-200 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 500,
        json: async () => ({ error: { message: "Erro interno." } }),
      }),
    );

    render(<CandidateDetail id={7} onBack={vi.fn()} />);

    expect(
      await screen.findByText(/Não foi possível carregar o candidato/i),
    ).toBeInTheDocument();
  });

  it("shows a clear generic error message when the request rejects (network failure)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    render(<CandidateDetail id={7} onBack={vi.fn()} />);

    expect(
      await screen.findByText(/Não foi possível carregar o candidato/i),
    ).toBeInTheDocument();
  });

  it("calls onBack when 'Voltar para a listagem' is clicked", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        json: async () => ({ data: SAMPLE_CANDIDATE }),
      }),
    );
    const onBack = vi.fn();

    render(<CandidateDetail id={7} onBack={onBack} />);

    await screen.findByText("Carla Mendes");
    fireEvent.click(screen.getByRole("button", { name: "Voltar para a listagem" }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("allows navigating back even while the request is still loading", () => {
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
    const onBack = vi.fn();

    render(<CandidateDetail id={7} onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: "Voltar para a listagem" }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("requests the candidate by id", () => {
    const fetchMock = vi.fn().mockReturnValue(new Promise(() => {}));
    vi.stubGlobal("fetch", fetchMock);

    render(<CandidateDetail id={42} onBack={vi.fn()} />);

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:3001/api/candidates/42");
  });
});
