import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App shell", () => {
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

  it("navigates from 'Novo cadastro' to 'Candidatos' and back", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Candidatos" }));

    expect(
      screen.getByRole("heading", { name: "Candidatos" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Novo cadastro" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Novo cadastro" }));

    expect(
      screen.getByRole("heading", { name: "Novo cadastro" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Candidatos" }),
    ).not.toBeInTheDocument();
  });

  it("navigates from the list view to the detail view with the selected id, and back", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Candidatos" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Ver detalhe de exemplo" }),
    );

    expect(
      screen.getByRole("heading", { name: "Detalhe do candidato" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/#1/)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Voltar para Candidatos" }),
    );

    expect(
      screen.getByRole("heading", { name: "Candidatos" }),
    ).toBeInTheDocument();
  });
});
