import type { FormEvent, ReactNode } from "react";

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

type SectionHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

function SectionHeader({ title, description, action }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h3 className="section-title">{title}</h3>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

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

function RemoveButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition duration-150 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
      onClick={onClick}
      type="button"
    >
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path
          d="M9.75 9.75v6.5m4.5-6.5v6.5m-7-9h9.5m-8 0 .45-1.126A1.25 1.25 0 0 1 10.361 5h3.278c.51 0 .968.31 1.157.784L15.25 6.5m-7.5 0 .44 10.159A1.5 1.5 0 0 0 9.688 18.1h4.624a1.5 1.5 0 0 0 1.498-1.441L16.25 6.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
      {label}
    </button>
  );
}

function AddButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button className="secondary-button gap-2" onClick={onClick} type="button">
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path
          d="M12 5.75v12.5M5.75 12h12.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.7"
        />
      </svg>
      {label}
    </button>
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
    <form className="surface p-5 sm:p-6" onSubmit={onSubmit}>
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="section-eyebrow">Step 2</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">Review and edit</h2>
          <p className="mt-1 text-sm text-slate-500">
            Confirm the extracted information before submitting.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="secondary-button" onClick={onReset} type="button">
            Reset
          </button>
          <button className="action-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>

      {statusMessage ? (
        <div className="status-banner mt-4 border-emerald-200 bg-emerald-50 text-emerald-700">
          {statusMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="status-banner mt-4 border-rose-200 bg-rose-50 text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <section className="mt-6">
        <SectionHeader title="Personal Info" />
        <div className="section-divider" />

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
            label="Title"
            onChange={(value) => onChangeField("title", value)}
            placeholder="Software Engineer"
            value={resume.title}
          />
          <InputField
            id="location"
            label="Location"
            onChange={(value) => onChangeField("location", value)}
            placeholder="City, Country"
            value={resume.location}
          />
        </div>

        <div className="mt-4">
          <TextareaField
            id="summary"
            label="Summary"
            onChange={(value) => onChangeField("summary", value)}
            placeholder="Short professional summary"
            rows={5}
            value={resume.summary}
          />
        </div>
      </section>

      <section className="mt-8">
        <SectionHeader
          description="One skill per line keeps the parser output easy to review."
          title="Skills"
        />
        <div className="section-divider" />

        <div className="mt-4">
          <TextareaField
            id="skills"
            label="Skills"
            onChange={onChangeSkills}
            placeholder="FastAPI&#10;Next.js&#10;PostgreSQL"
            rows={8}
            value={listToMultiline(resume.skills)}
          />
        </div>
      </section>

      <section className="mt-8">
        <SectionHeader
          action={<AddButton label="Add education" onClick={onAddEducationItem} />}
          description="Review each school, degree, and supporting detail separately."
          title="Education"
        />
        <div className="section-divider" />

        <div className="mt-4 space-y-4">
          {resume.education.length === 0 ? (
            <div className="empty-state">No education entries have been extracted yet.</div>
          ) : null}

          {resume.education.map((entry, index) => (
            <div
              className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5"
              key={`education-${index}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-950">Education {index + 1}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    School, degree, dates, and supporting details.
                  </p>
                </div>
                <RemoveButton label="Remove" onClick={() => onRemoveEducationItem(index)} />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  label="Field of Study"
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
                  label="Grade or GPA"
                  onChange={(value) => onChangeEducationItem(index, "grade", value)}
                  placeholder="CGPA 8.8"
                  value={entry.grade}
                />
                <div className="sm:col-span-2 lg:col-span-3">
                  <InputField
                    id={`education-location-${index}`}
                    label="Location"
                    onChange={(value) => onChangeEducationItem(index, "location", value)}
                    placeholder="City, Country"
                    value={entry.location}
                  />
                </div>
              </div>

              <div className="mt-4">
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
        </div>
      </section>

      <section className="mt-8">
        <SectionHeader
          action={<AddButton label="Add experience" onClick={onAddExperienceItem} />}
          description="Keep each role isolated for cleaner edits and more accurate exports."
          title="Experience"
        />
        <div className="section-divider" />

        <div className="mt-4 space-y-4">
          {resume.experience.length === 0 ? (
            <div className="empty-state">No experience entries have been extracted yet.</div>
          ) : null}

          {resume.experience.map((entry, index) => (
            <div
              className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5"
              key={`experience-${index}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-950">Experience {index + 1}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Company, role, dates, summary, and highlights.
                  </p>
                </div>
                <RemoveButton label="Remove" onClick={() => onRemoveExperienceItem(index)} />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <TextareaField
                  id={`experience-summary-${index}`}
                  label="Summary"
                  onChange={(value) => onChangeExperienceItem(index, "summary", value)}
                  placeholder="Short role summary"
                  rows={5}
                  value={entry.summary}
                />
                <TextareaField
                  id={`experience-highlights-${index}`}
                  label="Highlights"
                  onChange={(value) => onChangeExperienceHighlights(index, value)}
                  placeholder="One achievement per line"
                  rows={5}
                  value={listToMultiline(entry.highlights)}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </form>
  );
}
