import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SUMMARY_MAX_LENGTH } from "shared";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CandidateForm } from "./CandidateForm";

function fillRequiredFields(fullName = "Maria Souza", email = "maria.souza@example.com") {
  fireEvent.change(screen.getByLabelText(/Nome completo/i), {
    target: { value: fullName },
  });
  fireEvent.change(screen.getByLabelText(/E-mail/i), {
    target: { value: email },
  });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: /Cadastrar/i }));
}

describe("CandidateForm", () => {
  afterEach(() => {
    // Undo vi.stubGlobal("fetch", ...) so one test's mock never leaks into
    // the next (afterEach(() => cleanup()) in setupTests.ts only unmounts
    // the DOM, it doesn't touch stubbed globals).
    vi.unstubAllGlobals();
  });

  it("shows errors for empty fullName and email, and never calls fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<CandidateForm />);
    submit();

    expect(await screen.findByText("Nome completo é obrigatório.")).toBeInTheDocument();
    expect(screen.getByText("E-mail é obrigatório.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows an error for an invalid e-mail format, and never calls fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<CandidateForm />);
    fillRequiredFields("Maria Souza", "nao-e-um-email");
    submit();

    expect(await screen.findByText("E-mail em formato inválido.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows an error when an optional field exceeds its max length, and never calls fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<CandidateForm />);
    fillRequiredFields();
    fireEvent.change(screen.getByLabelText(/Resumo profissional/i), {
      target: { value: "a".repeat(SUMMARY_MAX_LENGTH + 1) },
    });
    submit();

    expect(
      await screen.findByText(`Resumo deve ter no máximo ${SUMMARY_MAX_LENGTH} caracteres.`),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits the expected payload on valid data and shows a success message", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 201,
      json: async () => ({
        data: { id: 1, fullName: "Maria Souza", email: "maria.souza@example.com" },
        message: "Cadastro salvo com sucesso.",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<CandidateForm />);
    fillRequiredFields();
    submit();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:3001/api/candidates");
    expect(options.method).toBe("POST");
    expect(options.headers).toMatchObject({ "Content-Type": "application/json" });
    expect(JSON.parse(options.body)).toEqual({
      fullName: "Maria Souza",
      email: "maria.souza@example.com",
      phone: "",
      areaOfInterest: "",
      summary: "",
    });

    expect(await screen.findByText("Cadastro salvo com sucesso.")).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome completo/i)).toHaveValue("");
    expect(screen.getByLabelText(/E-mail/i)).toHaveValue("");
  });

  it("maps a mocked 400 server error response back onto the matching field", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 400,
      json: async () => ({
        error: {
          message: "Dados de cadastro inválidos.",
          fields: { email: "E-mail em formato inválido." },
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<CandidateForm />);
    fillRequiredFields();
    submit();

    expect(await screen.findByText("E-mail em formato inválido.")).toBeInTheDocument();
  });

  it("shows a generic error message on network failure, without crashing the form", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);

    render(<CandidateForm />);
    fillRequiredFields();
    submit();

    expect(
      await screen.findByText(/Não foi possível conectar ao servidor/i),
    ).toBeInTheDocument();
    // The form keeps the data the user already typed — never resets on failure.
    expect(screen.getByLabelText(/Nome completo/i)).toHaveValue("Maria Souza");
  });

  it("accepts external initial values to pre-fill fullName, email and phone", () => {
    vi.stubGlobal("fetch", vi.fn());

    render(
      <CandidateForm
        initialValues={{
          fullName: "João Pereira",
          email: "joao.pereira@example.com",
          phone: "(41) 99999-0000",
        }}
      />,
    );

    expect(screen.getByLabelText(/Nome completo/i)).toHaveValue("João Pereira");
    expect(screen.getByLabelText(/E-mail/i)).toHaveValue("joao.pereira@example.com");
    expect(screen.getByLabelText(/Telefone/i)).toHaveValue("(41) 99999-0000");
  });
});
