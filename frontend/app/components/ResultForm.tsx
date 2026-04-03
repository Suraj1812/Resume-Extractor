import type { FormEvent } from "react";

import { listToMultiline } from "@/lib/types";
import type { ResumeData } from "@/lib/types";

type ResultFormProps = {
  resume: ResumeData;
  isSubmitting: boolean;
  statusMessage: string | null;
  errorMessage: string | null;
  onChangeField: (field: "name" | "email" | "phone", value: string) => void;
  onChangeList: (field: "skills" | "education" | "experience", value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
};

export function ResultForm({
  resume,
  isSubmitting,
  statusMessage,
  errorMessage,
  onChangeField,
  onChangeList,
  onSubmit,
  onReset,
}: ResultFormProps) {
  return (
    <form className="panel p-6 sm:p-8" onSubmit={onSubmit}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="panel-title">Step 2</p>
          <h2 className="mt-2 font-display text-3xl text-ink">Review and edit</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="ghost-button" onClick={onReset} type="button">
            Reset
          </button>
          <button className="action-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Submitting..." : "Submit form"}
          </button>
        </div>
      </div>

      {statusMessage ? (
        <div className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {statusMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-5 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <div>
          <label className="field-label" htmlFor="name">
            Name
          </label>
          <input
            className="input"
            id="name"
            onChange={(event) => onChangeField("name", event.target.value)}
            placeholder="Candidate name"
            value={resume.name}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <input
            className="input"
            id="email"
            onChange={(event) => onChangeField("email", event.target.value)}
            placeholder="name@example.com"
            value={resume.email}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="phone">
            Phone
          </label>
          <input
            className="input"
            id="phone"
            onChange={(event) => onChangeField("phone", event.target.value)}
            placeholder="+1 555 123 4567"
            value={resume.phone}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div>
          <label className="field-label" htmlFor="skills">
            Skills
          </label>
          <textarea
            className="textarea"
            id="skills"
            onChange={(event) => onChangeList("skills", event.target.value)}
            placeholder="One skill per line"
            value={listToMultiline(resume.skills)}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="education">
            Education
          </label>
          <textarea
            className="textarea"
            id="education"
            onChange={(event) => onChangeList("education", event.target.value)}
            placeholder="One education entry per line"
            value={listToMultiline(resume.education)}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="experience">
            Experience
          </label>
          <textarea
            className="textarea"
            id="experience"
            onChange={(event) => onChangeList("experience", event.target.value)}
            placeholder="One experience entry per line"
            value={listToMultiline(resume.experience)}
          />
        </div>
      </div>
    </form>
  );
}
