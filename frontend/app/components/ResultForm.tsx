import type { FormEvent } from "react";

import { listToMultiline } from "@/lib/types";
import type { EducationItem, ExperienceItem, ResumeData } from "@/lib/types";

type ResultFormProps = {
  resume: ResumeData;
  isSubmitting: boolean;
  statusMessage: string | null;
  errorMessage: string | null;
  onChangeField: (
    field: "name" | "email" | "phone" | "title" | "location" | "summary",
    value: string,
  ) => void;
  onChangeSkills: (value: string) => void;
  onChangeEducationItem: (
    index: number,
    field: keyof Omit<EducationItem, "details">,
    value: string,
  ) => void;
  onChangeEducationDetails: (index: number, value: string) => void;
  onAddEducationItem: () => void;
  onRemoveEducationItem: (index: number) => void;
  onChangeExperienceItem: (
    index: number,
    field: keyof Omit<ExperienceItem, "highlights">,
    value: string,
  ) => void;
  onChangeExperienceHighlights: (index: number, value: string) => void;
  onAddExperienceItem: () => void;
  onRemoveExperienceItem: (index: number) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
};

type InputFieldProps = {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
};

type TextareaFieldProps = InputFieldProps & {
  rows?: number;
};

function InputField({ id, label, placeholder, value, onChange }: InputFieldProps) {
  return (
    <div>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <input
        className="input"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </div>
  );
}

function TextareaField({
  id,
  label,
  placeholder,
  rows = 4,
  value,
  onChange,
}: TextareaFieldProps) {
  return (
    <div>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <textarea
        className="textarea"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        value={value}
      />
    </div>
  );
}

export function ResultForm({
  resume,
  isSubmitting,
  statusMessage,
  errorMessage,
  onChangeField,
  onChangeSkills,
  onChangeEducationItem,
  onChangeEducationDetails,
  onAddEducationItem,
  onRemoveEducationItem,
  onChangeExperienceItem,
  onChangeExperienceHighlights,
  onAddExperienceItem,
  onRemoveExperienceItem,
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

      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <InputField
          id="name"
          label="Name"
          onChange={(value) => onChangeField("name", value)}
          placeholder="Candidate name"
          value={resume.name}
        />
        <InputField
          id="email"
          label="Email"
          onChange={(value) => onChangeField("email", value)}
          placeholder="name@example.com"
          value={resume.email}
        />
        <InputField
          id="phone"
          label="Phone"
          onChange={(value) => onChangeField("phone", value)}
          placeholder="+1 555 123 4567"
          value={resume.phone}
        />
        <InputField
          id="title"
          label="Current Title"
          onChange={(value) => onChangeField("title", value)}
          placeholder="Senior Software Engineer"
          value={resume.title}
        />
        <InputField
          id="location"
          label="Location"
          onChange={(value) => onChangeField("location", value)}
          placeholder="Bengaluru, India"
          value={resume.location}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <TextareaField
          id="skills"
          label="Skills"
          onChange={onChangeSkills}
          placeholder="One skill per line"
          rows={8}
          value={listToMultiline(resume.skills)}
        />
        <TextareaField
          id="summary"
          label="Professional Summary"
          onChange={(value) => onChangeField("summary", value)}
          placeholder="Short professional summary"
          rows={8}
          value={resume.summary}
        />
      </div>

      <section className="mt-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="panel-title">Education</p>
            <p className="mt-2 text-sm text-slate-500">
              Each education record is split into its own editable fields.
            </p>
          </div>
          <button className="ghost-button" onClick={onAddEducationItem} type="button">
            Add education
          </button>
        </div>

        {resume.education.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50/80 px-5 py-4 text-sm text-slate-500">
            No education entries were extracted yet.
          </div>
        ) : null}

        {resume.education.map((entry, index) => (
          <div className="rounded-[1.75rem] border border-slate-200 bg-white/70 p-5" key={`education-${index}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Education {index + 1}
              </p>
              <button
                className="ghost-button"
                onClick={() => onRemoveEducationItem(index)}
                type="button"
              >
                Remove
              </button>
            </div>

            <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <InputField
                id={`education-institution-${index}`}
                label="Institution"
                onChange={(value) => onChangeEducationItem(index, "institution", value)}
                placeholder="University or school"
                value={entry.institution}
              />
              <InputField
                id={`education-degree-${index}`}
                label="Degree"
                onChange={(value) => onChangeEducationItem(index, "degree", value)}
                placeholder="B.Tech, B.Sc, MBA"
                value={entry.degree}
              />
              <InputField
                id={`education-field-${index}`}
                label="Field Of Study"
                onChange={(value) => onChangeEducationItem(index, "field_of_study", value)}
                placeholder="Computer Science"
                value={entry.field_of_study}
              />
              <InputField
                id={`education-start-${index}`}
                label="Start Date"
                onChange={(value) => onChangeEducationItem(index, "start_date", value)}
                placeholder="2022"
                value={entry.start_date}
              />
              <InputField
                id={`education-end-${index}`}
                label="End Date"
                onChange={(value) => onChangeEducationItem(index, "end_date", value)}
                placeholder="2025"
                value={entry.end_date}
              />
              <InputField
                id={`education-grade-${index}`}
                label="Grade / GPA"
                onChange={(value) => onChangeEducationItem(index, "grade", value)}
                placeholder="CGPA: 8.8"
                value={entry.grade}
              />
              <InputField
                id={`education-location-${index}`}
                label="Location"
                onChange={(value) => onChangeEducationItem(index, "location", value)}
                placeholder="City, Country"
                value={entry.location}
              />
            </div>

            <div className="mt-5">
              <TextareaField
                id={`education-details-${index}`}
                label="Additional Details"
                onChange={(value) => onChangeEducationDetails(index, value)}
                placeholder="One detail per line"
                rows={4}
                value={listToMultiline(entry.details)}
              />
            </div>
          </div>
        ))}
      </section>

      <section className="mt-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="panel-title">Experience</p>
            <p className="mt-2 text-sm text-slate-500">
              Roles are broken into company, title, dates, summary, and highlights.
            </p>
          </div>
          <button className="ghost-button" onClick={onAddExperienceItem} type="button">
            Add experience
          </button>
        </div>

        {resume.experience.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50/80 px-5 py-4 text-sm text-slate-500">
            No experience entries were extracted yet.
          </div>
        ) : null}

        {resume.experience.map((entry, index) => (
          <div className="rounded-[1.75rem] border border-slate-200 bg-white/70 p-5" key={`experience-${index}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Experience {index + 1}
              </p>
              <button
                className="ghost-button"
                onClick={() => onRemoveExperienceItem(index)}
                type="button"
              >
                Remove
              </button>
            </div>

            <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <InputField
                id={`experience-company-${index}`}
                label="Company"
                onChange={(value) => onChangeExperienceItem(index, "company", value)}
                placeholder="Company name"
                value={entry.company}
              />
              <InputField
                id={`experience-title-${index}`}
                label="Job Title"
                onChange={(value) => onChangeExperienceItem(index, "title", value)}
                placeholder="Software Engineer"
                value={entry.title}
              />
              <InputField
                id={`experience-location-${index}`}
                label="Location"
                onChange={(value) => onChangeExperienceItem(index, "location", value)}
                placeholder="Remote or City, Country"
                value={entry.location}
              />
              <InputField
                id={`experience-start-${index}`}
                label="Start Date"
                onChange={(value) => onChangeExperienceItem(index, "start_date", value)}
                placeholder="Jan 2021"
                value={entry.start_date}
              />
              <InputField
                id={`experience-end-${index}`}
                label="End Date"
                onChange={(value) => onChangeExperienceItem(index, "end_date", value)}
                placeholder="Present"
                value={entry.end_date}
              />
            </div>

            <div className="mt-5 grid gap-6 xl:grid-cols-2">
              <TextareaField
                id={`experience-summary-${index}`}
                label="Role Summary"
                onChange={(value) => onChangeExperienceItem(index, "summary", value)}
                placeholder="Short summary of the role"
                rows={5}
                value={entry.summary}
              />
              <TextareaField
                id={`experience-highlights-${index}`}
                label="Highlights"
                onChange={(value) => onChangeExperienceHighlights(index, value)}
                placeholder="One highlight per line"
                rows={5}
                value={listToMultiline(entry.highlights)}
              />
            </div>
          </div>
        ))}
      </section>
    </form>
  );
}
