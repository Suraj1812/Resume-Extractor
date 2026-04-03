"use client";

import Image from "next/image";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";

import { Loader } from "@/app/components/Loader";
import { ResultForm } from "@/app/components/ResultForm";
import { UploadBox } from "@/app/components/UploadBox";
import { mockSubmitResume, parseResume } from "@/lib/api";
import { emptyResume, multilineToList, type ResumeData } from "@/lib/types";

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [resume, setResume] = useState<ResumeData>(emptyResume());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const jsonPreview = useMemo(() => JSON.stringify(resume, null, 2), [resume]);

  function resetState() {
    setSelectedFile(null);
    setResume(emptyResume());
    setStatusMessage(null);
    setErrorMessage(null);
  }

  async function handleParse() {
    if (!selectedFile) {
      setErrorMessage("Choose a resume file before parsing.");
      return;
    }

    setIsParsing(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const payload = await parseResume(selectedFile);
      setResume(payload);
      setStatusMessage("Resume parsed successfully. Review the autofilled form below.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to parse the selected file.");
    } finally {
      setIsParsing(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      await mockSubmitResume(resume);
      setStatusMessage("Form submitted successfully. This is a mock submit for the first production release.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to submit the form.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField(field: "name" | "email" | "phone", value: string) {
    setResume((current) => ({ ...current, [field]: value }));
  }

  function updateList(field: "skills" | "education" | "experience", value: string) {
    setResume((current) => ({ ...current, [field]: multilineToList(value) }));
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <section className="panel overflow-hidden px-6 py-8 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-4">
              <Image
                alt="Resume Extractor logo"
                className="h-12 w-auto sm:h-14"
                height={56}
                src="/logo.svg"
                priority
                width={224}
              />
              <div className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-orange-700">
                Resume Intelligence
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="max-w-3xl font-display text-4xl leading-none text-ink sm:text-5xl lg:text-7xl">
                Upload a resume, extract structured JSON, and edit the form instantly.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                The Next.js UI sends PDF, DOCX, and TXT resumes to FastAPI. The backend
                parses the file, runs transformer-based NER with regex fallback, normalizes
                the output, and autofills the form below.
              </p>
            </div>
          </div>
          <div className="grid gap-4">
            {[
              ["Input", "PDF, DOCX, TXT"],
              ["API", "POST /api/parse-resume"],
              ["Output", "Editable JSON-backed form"],
              ["SEO", "SVG identity, robots, sitemap, JSON-LD"],
            ].map(([label, value]) => (
              <div
                className="rounded-3xl border border-slate-200/80 bg-white/80 px-5 py-4"
                key={label}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {label}
                </p>
                <p className="mt-2 text-lg font-semibold text-ink">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.9fr)]">
        <section className="space-y-6">
          <UploadBox
            dragging={dragging}
            isLoading={isParsing}
            onDragStateChange={setDragging}
            onExtract={handleParse}
            onFileSelect={setSelectedFile}
            selectedFile={selectedFile}
          />

          {isParsing ? <Loader /> : null}

          <ResultForm
            errorMessage={errorMessage}
            isSubmitting={isSubmitting}
            onChangeField={updateField}
            onChangeList={updateList}
            onReset={resetState}
            onSubmit={handleSubmit}
            resume={resume}
            statusMessage={statusMessage}
          />
        </section>

        <aside className="space-y-6">
          <section className="panel p-6">
            <p className="panel-title">Structured JSON</p>
            <p className="mt-2 text-sm text-slate-500">
              This is the exact normalized payload currently powering the form.
            </p>
            <pre className="mt-4 max-h-[540px] overflow-auto rounded-[1.75rem] bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-100">
              {jsonPreview}
            </pre>
          </section>
        </aside>
      </div>
    </main>
  );
}
