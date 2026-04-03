import { z } from "zod";

export const educationItemSchema = z.object({
  institution: z.string(),
  degree: z.string(),
  field_of_study: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  grade: z.string(),
  location: z.string(),
  details: z.array(z.string()),
});

export const experienceItemSchema = z.object({
  company: z.string(),
  title: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  location: z.string(),
  summary: z.string(),
  highlights: z.array(z.string()),
});

export const resumeDataSchema = z.object({
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  title: z.string(),
  location: z.string(),
  summary: z.string(),
  skills: z.array(z.string()),
  education: z.array(educationItemSchema),
  experience: z.array(experienceItemSchema),
});

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export type EducationItem = z.infer<typeof educationItemSchema>;
export type ExperienceItem = z.infer<typeof experienceItemSchema>;
export type ResumeData = z.infer<typeof resumeDataSchema>;

export function emptyEducationItem(): EducationItem {
  return {
    institution: "",
    degree: "",
    field_of_study: "",
    start_date: "",
    end_date: "",
    grade: "",
    location: "",
    details: [],
  };
}

export function emptyExperienceItem(): ExperienceItem {
  return {
    company: "",
    title: "",
    start_date: "",
    end_date: "",
    location: "",
    summary: "",
    highlights: [],
  };
}

export function emptyResume(): ResumeData {
  return {
    name: "",
    email: "",
    phone: "",
    title: "",
    location: "",
    summary: "",
    skills: [],
    education: [],
    experience: [],
  };
}

export function multilineToList(value: string): string[] {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function listToMultiline(values: string[]): string {
  return values.join("\n");
}
