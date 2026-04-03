import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { getSiteUrl } from "@/lib/site";

import "./globals.css";

const siteName = "Resume Extractor";
const siteDescription =
  "Production-ready AI resume parser built with Next.js and FastAPI to extract structured candidate data from PDF, DOCX, and TXT files.";
const siteUrl = getSiteUrl();
const ogImageUrl = siteUrl ? new URL("/og-image.svg", siteUrl).toString() : null;

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl), alternates: { canonical: "/" } } : {}),
  applicationName: siteName,
  title: {
    default: "Resume Extractor | AI Resume Parser and Autofill Workflow",
    template: "%s | Resume Extractor",
  },
  description: siteDescription,
  keywords: [
    "resume extractor",
    "resume parser",
    "cv parser",
    "resume upload",
    "fastapi resume parser",
    "next.js resume extractor",
    "ai resume parsing",
    "structured resume json",
  ],
  category: "technology",
  manifest: "/site.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/icon.svg", type: "image/svg+xml" }],
    other: [{ rel: "mask-icon", url: "/icon.svg", color: "#0f172a" }],
  },
  openGraph: {
    type: "website",
    siteName,
    title: "Resume Extractor | AI Resume Parser and Autofill Workflow",
    description: siteDescription,
    ...(siteUrl ? { url: siteUrl } : {}),
    ...(ogImageUrl
      ? {
          images: [
            {
              url: ogImageUrl,
              width: 1200,
              height: 630,
              alt: "Resume Extractor preview card showing structured candidate data extraction.",
            },
          ],
        }
      : {}),
  },
  twitter: {
    card: "summary_large_image",
    title: "Resume Extractor | AI Resume Parser and Autofill Workflow",
    description: siteDescription,
    ...(ogImageUrl ? { images: [ogImageUrl] } : {}),
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#f97316",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: siteName,
        logo: siteUrl ? `${siteUrl}/logo.svg` : "/logo.svg",
      },
      {
        "@type": "WebSite",
        name: siteName,
        description: siteDescription,
        ...(siteUrl ? { url: siteUrl } : {}),
      },
      {
        "@type": "SoftwareApplication",
        name: siteName,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: siteDescription,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        ...(siteUrl ? { url: siteUrl } : {}),
      },
    ],
  };

  return (
    <html lang="en">
      <body>
        <script
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          type="application/ld+json"
        />
        {children}
      </body>
    </html>
  );
}
