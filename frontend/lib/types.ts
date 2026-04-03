import { z } from "zod";

export const resumeDataSchema = z.object({
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  skills: z.array(z.string()),
  education: z.array(z.string()),
  experience: z.array(z.string()),
});

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export type ResumeData = z.infer<typeof resumeDataSchema>;

export function emptyResume(): ResumeData {
  return {
    name: "",
    email: "",
    phone: "",
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
