function normalizeUrl(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim().replace(/\/$/, "");
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export function getSiteUrl(): string | undefined {
  return normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL) ?? normalizeUrl(process.env.RAILWAY_PUBLIC_DOMAIN);
}
