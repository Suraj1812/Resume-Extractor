import { errorResponseSchema, resumeDataSchema, type ResumeData } from "@/lib/types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

async function handleError(response: Response): Promise<never> {
  const payload = await response.json().catch(() => null);
  const parsed = errorResponseSchema.safeParse(payload);
  throw new Error(parsed.success ? parsed.data.error.message : "Request failed.");
}

export async function parseResume(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${apiBaseUrl}/api/parse-resume`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    await handleError(response);
  }

  const payload = await response.json();
  return resumeDataSchema.parse(payload);
}

export async function mockSubmitResume(data: ResumeData) {
  return new Promise<ResumeData>((resolve) => {
    window.setTimeout(() => resolve(resumeDataSchema.parse(data)), 500);
  });
}
