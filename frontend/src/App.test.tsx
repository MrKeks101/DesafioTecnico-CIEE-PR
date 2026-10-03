import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

describe("App shell", () => {
  afterEach(() => {
    // Mirrors CandidateForm.test.tsx / CandidateList.test.tsx: undo
    // vi.stubGlobal("fetch", ...) so one test's mock never leaks into the
    // next (afterEach(() => cleanup()) in setupTests.ts only unmounts the
    // DOM, it doesn't touch stubbed globals).
    vi.unstubAllGlobals();
  });

  it("shows the nav with the expected items", () => {
    render(<App />);

    expect(
      screen.getByRole("navigation", { name: "Navegação principal" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Novo cadastro" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Candidatos" }),
    ).toBeInTheDocument();
  });

  it("starts on the 'Novo cadastro' view", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Novo cadastro" }),
    ).toBeInTheDocument();
  });

  it("navigates from 'Novo cadastro' to 'Candidatos' and back", async () => {
    // CandidateList (ticket 010) fetches on mount once the "Candidatos" view
    // is shown — stub it so this navigation test doesn't make a real network
    // call. The empty list is irrelevant here; only the heading is asserted.
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ data: [] }),
    }));

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Candidatos" }));

    expect(
      screen.getByRole("heading", { name: "Candidatos" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Novo cadastro" }),
    ).not.toBeInTheDocument();
    expect(
      await screen.findByText("Nenhum candidato cadastrado ainda."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Novo cadastro" }));

    expect(
      screen.getByRole("heading", { name: "Novo cadastro" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Candidatos" }),
    ).not.toBeInTheDocument();
  });

  it("navigates from the list view to the detail view with the selected candidate's id, and back", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({
        data: [
          { id: 42, fullName: "Maria Souza", email: "maria.souza@example.com" },
        ],
      }),
    }));

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Candidatos" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Ver detalhes" }),
    );

    expect(
      screen.getByRole("heading", { name: "Detalhe do candidato" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/#42/)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Voltar para Candidatos" }),
    );

    expect(
      screen.getByRole("heading", { name: "Candidatos" }),
    ).toBeInTheDocument();
  });
});
