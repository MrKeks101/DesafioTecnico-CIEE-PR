import { useState, type ChangeEvent, type FormEvent } from "react";
import { candidateSchema } from "shared";

// Mirrors packages/shared's CandidateInput, but as plain strings for every
// field (including the optional ones) so controlled <input>/<textarea>
// elements always have a defined value to bind to. candidateSchema.safeParse
// still runs against this shape on submit — empty optional strings satisfy
// `.optional()` just as well as `undefined` does.
export type CandidateFormValues = {
  fullName: string;
  email: string;
  phone: string;
  areaOfInterest: string;
  summary: string;
};

const EMPTY_VALUES: CandidateFormValues = {
  fullName: "",
  email: "",
  phone: "",
  areaOfInterest: "",
  summary: "",
};

// Vite exposes build-time env vars via import.meta.env; VITE_API_URL lets
// the API base be configured per environment without hardcoding it (ticket
// 009). Falls back to the local backend dev port when unset.
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

type FieldErrors = Partial<Record<keyof CandidateFormValues, string>>;

export type CandidateFormProps = {
  // Pre-fills the controlled fields from external state. This is the hook
  // ticket 014 (upload de PDF) will use to populate fullName/email/phone
  // from the fields extracted out of an uploaded résumé — this ticket only
  // needs to expose the capability, not consume it yet.
  initialValues?: Partial<CandidateFormValues>;
  // Called after a successful submit (201), with the candidate returned by
  // the API. The shell (ticket 008) can use this to navigate to the listing
  // instead of staying on the form; optional because this ticket's default
  // behaviour is just to show a confirmation and reset the form in place.
  onSuccess?: (candidate: unknown) => void;
};

export function CandidateForm({ initialValues, onSuccess }: CandidateFormProps) {
  const [values, setValues] = useState<CandidateFormValues>({
    ...EMPTY_VALUES,
    ...initialValues,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(field: keyof CandidateFormValues) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((previous) => ({ ...previous, [field]: event.target.value }));
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage(null);
    setFormError(null);

    const result = candidateSchema.safeParse(values);

    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && !(field in fieldErrors)) {
          fieldErrors[field as keyof CandidateFormValues] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/candidates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      const body = await response.json().catch(() => null);

      if (response.status === 201) {
        setValues(EMPTY_VALUES);
        setSuccessMessage("Cadastro salvo com sucesso.");
        onSuccess?.(body?.data);
        return;
      }

      // Server validation errors come back as { error: { message, fields } }
      // (backend/src/candidates.ts), mirroring the same field names this
      // form uses — map them straight back onto the inputs.
      if (body?.error?.fields) {
        setErrors(body.error.fields);
      }
      setFormError(
        body?.error?.message ?? "Não foi possível salvar o cadastro. Tente novamente.",
      );
    } catch {
      // Network failure (server down, offline, etc.) — never leave the form
      // stuck or crash the page; show a generic message and let the user
      // retry (specs.md: PDF/manual registration must never be blocked).
      setFormError("Não foi possível conectar ao servidor. Tente novamente mais tarde.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="fullName">Nome completo *</label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          value={values.fullName}
          onChange={handleChange("fullName")}
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={errors.fullName ? "fullName-error" : undefined}
        />
        {errors.fullName && (
          <span id="fullName-error" role="alert">
            {errors.fullName}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="email">E-mail *</label>
        <input
          id="email"
          name="email"
          type="text"
          value={values.email}
          onChange={handleChange("email")}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <span id="email-error" role="alert">
            {errors.email}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="phone">Telefone</label>
        <input
          id="phone"
          name="phone"
          type="text"
          value={values.phone}
          onChange={handleChange("phone")}
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? "phone-error" : undefined}
        />
        {errors.phone && (
          <span id="phone-error" role="alert">
            {errors.phone}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="areaOfInterest">Área ou cargo de interesse</label>
        <input
          id="areaOfInterest"
          name="areaOfInterest"
          type="text"
          value={values.areaOfInterest}
          onChange={handleChange("areaOfInterest")}
          aria-invalid={Boolean(errors.areaOfInterest)}
          aria-describedby={errors.areaOfInterest ? "areaOfInterest-error" : undefined}
        />
        {errors.areaOfInterest && (
          <span id="areaOfInterest-error" role="alert">
            {errors.areaOfInterest}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="summary">Resumo profissional</label>
        <textarea
          id="summary"
          name="summary"
          value={values.summary}
          onChange={handleChange("summary")}
          aria-invalid={Boolean(errors.summary)}
          aria-describedby={errors.summary ? "summary-error" : undefined}
        />
        {errors.summary && (
          <span id="summary-error" role="alert">
            {errors.summary}
          </span>
        )}
      </div>

      {formError && <p role="alert">{formError}</p>}
      {successMessage && <p role="status">{successMessage}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Enviando..." : "Cadastrar"}
      </button>
    </form>
  );
}
