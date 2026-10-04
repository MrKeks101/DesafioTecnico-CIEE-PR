import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MAX_PDF_SIZE_BYTES } from "shared";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CandidateForm } from "../src/CandidateForm";

const EXTRACT_URL = "http://localhost:3001/api/candidates/extract";
const CREATE_URL = "http://localhost:3001/api/candidates";
const UPLOAD_LABEL = /Importar currículo em PDF/i;

function makePdf(size?: number): File {
  const file = new File(["%PDF-1.4 fake content"], "curriculo.pdf", {
    type: "application/pdf",
  });
  // Overriding size avoids allocating a real 5 MB buffer in the test.
  if (size !== undefined) {
    Object.defineProperty(file, "size", { value: size });
  }
  return file;
}

function jsonResponse(status: number, body: unknown) {
  return { status, json: async () => body };
}

function getUploadInput(): HTMLInputElement {
  return screen.getByLabelText(UPLOAD_LABEL) as HTMLInputElement;
}

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

describe("CandidateForm — importação de PDF", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects a non-PDF file with a clear message and never calls the extraction API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    // applyAccept: false lets the file reach the component even though the
    // input declares accept="application/pdf" — the client check must hold
    // on its own, since the accept attribute is only a hint for the picker.
    const user = userEvent.setup({ applyAccept: false });

    render(<CandidateForm />);
    const textFile = new File(["plain text"], "curriculo.txt", { type: "text/plain" });
    await user.upload(getUploadInput(), textFile);

    expect(
      await screen.findByText("Arquivo inválido: envie um arquivo PDF."),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(getUploadInput().files).toHaveLength(0);
  });

  it("rejects a PDF above 5 MB with a clear message and never calls the extraction API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<CandidateForm />);
    await user.upload(getUploadInput(), makePdf(MAX_PDF_SIZE_BYTES + 1));

    expect(
      await screen.findByText(/Arquivo muito grande.*5 MB/i),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(getUploadInput().files).toHaveLength(0);
  });

  it("accepts a PDF of exactly 5 MB and sends it to the extraction API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { data: {} }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<CandidateForm />);
    await user.upload(getUploadInput(), makePdf(MAX_PDF_SIZE_BYTES));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0][0]).toBe(EXTRACT_URL);
  });

  it("posts a valid PDF as multipart under the 'file' field and pre-fills the returned fields", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        data: {
          fullName: "Maria Extraída",
          email: "extraida@example.com",
          phone: "(41) 99999-0000",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<CandidateForm />);
    const pdf = makePdf();
    await user.upload(getUploadInput(), pdf);

    await waitFor(() => expect(screen.getByLabelText(/Nome completo/i)).toHaveValue("Maria Extraída"));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(EXTRACT_URL);
    expect(options.method).toBe("POST");
    expect(options.body).toBeInstanceOf(FormData);
    expect(options.body.get("file")).toBeInstanceOf(File);
    // No explicit Content-Type: the browser must set the multipart boundary.
    expect(options.headers).toBeUndefined();

    expect(screen.getByLabelText(/E-mail/i)).toHaveValue("extraida@example.com");
    expect(screen.getByLabelText(/Telefone/i)).toHaveValue("(41) 99999-0000");
  });

  it("only overwrites the fields the extraction returned, keeping what the person already typed", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, { data: { email: "extraida@example.com" } }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<CandidateForm />);
    fireEvent.change(screen.getByLabelText(/Nome completo/i), {
      target: { value: "Maria Digitada" },
    });
    await user.upload(getUploadInput(), makePdf());

    await waitFor(() =>
      expect(screen.getByLabelText(/E-mail/i)).toHaveValue("extraida@example.com"),
    );
    expect(screen.getByLabelText(/Nome completo/i)).toHaveValue("Maria Digitada");
    expect(screen.getByLabelText(/Telefone/i)).toHaveValue("");
  });

  it("shows the warning, leaves the fields empty and keeps the form usable for manual registration", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: {},
          warning: "Não foi possível ler o PDF. Preencha os campos manualmente.",
        }),
      )
      .mockResolvedValueOnce(jsonResponse(201, { data: { id: 7 } }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<CandidateForm />);
    await user.upload(getUploadInput(), makePdf());

    expect(
      await screen.findByText("Não foi possível ler o PDF. Preencha os campos manualmente."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome completo/i)).toHaveValue("");
    expect(screen.getByLabelText(/Nome completo/i)).toBeEnabled();
    expect(getUploadInput()).toBeEnabled();

    fillRequiredFields("Maria Manual", "manual@example.com");
    submit();

    expect(await screen.findByText("Cadastro salvo com sucesso.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe(CREATE_URL);
  });

  it("shows a clear message when the extraction request fails on the network, without blocking the form", async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<CandidateForm />);
    await user.upload(getUploadInput(), makePdf());

    expect(
      await screen.findByText(/Não foi possível conectar ao servidor para ler o currículo/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome completo/i)).toBeEnabled();
    expect(screen.getByRole("button", { name: /Cadastrar/i })).toBeEnabled();
  });

  it("shows the server error message when the extraction API rejects the file with 400", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse(400, {
        error: { message: "Arquivo inválido: envie um PDF de até 5 MB." },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<CandidateForm />);
    await user.upload(getUploadInput(), makePdf());

    expect(
      await screen.findByText("Arquivo inválido: envie um PDF de até 5 MB."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome completo/i)).toHaveValue("");
  });

  it("shows a 'Lendo currículo...' state while the extraction is in flight and disables the file input", async () => {
    let resolveExtract!: (value: unknown) => void;
    const fetchMock = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveExtract = resolve;
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<CandidateForm />);
    await user.upload(getUploadInput(), makePdf());

    expect(await screen.findByText("Lendo currículo...")).toBeInTheDocument();
    expect(getUploadInput()).toBeDisabled();

    resolveExtract(jsonResponse(200, { data: {} }));

    await waitFor(() =>
      expect(screen.queryByText("Lendo currículo...")).not.toBeInTheDocument(),
    );
    expect(getUploadInput()).toBeEnabled();
  });

  it("submits the values the person edited after the PDF pre-fill, not the extracted originals", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: { fullName: "Maria Extraída", email: "extraida@example.com" },
        }),
      )
      .mockResolvedValueOnce(jsonResponse(201, { data: { id: 1 } }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<CandidateForm />);
    await user.upload(getUploadInput(), makePdf());
    await waitFor(() => expect(screen.getByLabelText(/Nome completo/i)).toHaveValue("Maria Extraída"));

    fireEvent.change(screen.getByLabelText(/Nome completo/i), {
      target: { value: "Maria Corrigida" },
    });
    submit();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const [url, options] = fetchMock.mock.calls[1];
    expect(url).toBe(CREATE_URL);
    expect(JSON.parse(options.body)).toMatchObject({
      fullName: "Maria Corrigida",
      email: "extraida@example.com",
    });
  });

  it("never calls the create endpoint just because a PDF was selected", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, { data: { fullName: "Maria Extraída", email: "extraida@example.com" } }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<CandidateForm />);
    await user.upload(getUploadInput(), makePdf());
    await waitFor(() => expect(screen.getByLabelText(/Nome completo/i)).toHaveValue("Maria Extraída"));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(EXTRACT_URL);
  });
});
