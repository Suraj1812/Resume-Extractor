"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import { Loader } from "@/app/components/Loader";
import { Navbar } from "@/app/components/Navbar";
import { ResultForm } from "@/app/components/ResultForm";
import { UploadBox } from "@/app/components/UploadBox";
import { mockSubmitResume, parseResume } from "@/lib/api";
import {
  emptyEducationItem,
  emptyExperienceItem,
  emptyResume,
  multilineToList,
  type EducationItem,
  type ExperienceItem,
  type ResumeData,
} from "@/lib/types";

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [resume, setResume] = useState<ResumeData>(emptyResume());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  function updateField(
    field: "name" | "email" | "phone" | "title" | "location" | "summary",
    value: string,
  ) {
    setResume((current) => ({ ...current, [field]: value }));
  }

  function updateSkills(value: string) {
    setResume((current) => ({ ...current, skills: multilineToList(value) }));
  }

  function updateEducationItem(
    index: number,
    field: keyof Omit<EducationItem, "details">,
    value: string,
  ) {
    setResume((current) => ({
      ...current,
      education: current.education.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry,
      ),
    }));
  }

  function updateEducationDetails(index: number, value: string) {
    setResume((current) => ({
      ...current,
      education: current.education.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, details: multilineToList(value) } : entry,
      ),
    }));
  }

  function addEducationItem() {
    setResume((current) => ({
      ...current,
      education: [...current.education, emptyEducationItem()],
    }));
  }

  function removeEducationItem(index: number) {
    setResume((current) => ({
      ...current,
      education: current.education.filter((_, entryIndex) => entryIndex !== index),
    }));
  }

  function updateExperienceItem(
    index: number,
    field: keyof Omit<ExperienceItem, "highlights">,
    value: string,
  ) {
    setResume((current) => ({
      ...current,
      experience: current.experience.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry,
      ),
    }));
  }

  function updateExperienceHighlights(index: number, value: string) {
    setResume((current) => ({
      ...current,
      experience: current.experience.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, highlights: multilineToList(value) } : entry,
      ),
    }));
  }

  function addExperienceItem() {
    setResume((current) => ({
      ...current,
      experience: [...current.experience, emptyExperienceItem()],
    }));
  }

  function removeExperienceItem(index: number) {
    setResume((current) => ({
      ...current,
      experience: current.experience.filter((_, entryIndex) => entryIndex !== index),
    }));
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
        <UploadBox
          dragging={dragging}
          isLoading={isParsing}
          onDragStateChange={setDragging}
          onExtract={handleParse}
          onFileSelect={setSelectedFile}
          selectedFile={selectedFile}
        />

        {isParsing ? <Loader label="Extracting data..." /> : null}

        <ResultForm
          errorMessage={errorMessage}
          isSubmitting={isSubmitting}
          onAddEducationItem={addEducationItem}
          onAddExperienceItem={addExperienceItem}
          onChangeField={updateField}
          onChangeEducationDetails={updateEducationDetails}
          onChangeEducationItem={updateEducationItem}
          onChangeExperienceHighlights={updateExperienceHighlights}
          onChangeExperienceItem={updateExperienceItem}
          onChangeSkills={updateSkills}
          onReset={resetState}
          onRemoveEducationItem={removeEducationItem}
          onRemoveExperienceItem={removeExperienceItem}
          onSubmit={handleSubmit}
          resume={resume}
          statusMessage={statusMessage}
        />
      </main>
    </div>
  );
}
