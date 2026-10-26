import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";

import "./globals.css";

import { profile } from "@/data/profile";
import { siteConfig } from "@/data/site-config";
import { getNavItems } from "@/lib/content";
import { assertContentIsValid } from "@/lib/validate";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Aurora } from "@/components/visuals/Aurora";

/**
 * Content is validated once, here, at module evaluation.
 *
 * That means a typo in `src/data/` — a skill pointing at a category that does
 * not exist, a duplicate project slug, a malformed date — fails `next build`
 * with a message naming the file and the entry, instead of shipping a silently
 * missing card.
 */
assertContentIsValid();

/* --------------------------------------------------------------------
   Fonts — self-hosted, so the build needs no network and the browser
   makes no third-party request. See src/app/fonts/README.md.
   -------------------------------------------------------------------- */

const inter = localFont({
  src: "./fonts/inter-latin-var.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
  preload: true,
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
});

const spaceGrotesk = localFont({
  src: "./fonts/space-grotesk-latin-var.woff2",
  variable: "--font-space-grotesk",
  display: "swap",
  weight: "300 700",
  preload: true,
  fallback: ["system-ui", "sans-serif"],
});

const jetbrainsMono = localFont({
  src: "./fonts/jetbrains-mono-latin-var.woff2",
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: "100 800",
  // Used for small labels only, so it is not worth blocking first paint for.
  preload: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

/* --------------------------------------------------------------------
   Metadata
   -------------------------------------------------------------------- */

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s — ${profile.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: profile.name, url: siteConfig.url }],
  creator: profile.name,
  applicationName: `${profile.name} — Portfolio`,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: `${profile.name} — ${profile.title}`,
    title: siteConfig.title,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${profile.name} — ${profile.title}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  category: "technology",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#05060a",
  colorScheme: "dark",
};

/* --------------------------------------------------------------------
   Root layout
   -------------------------------------------------------------------- */

export default function RootLayout({ children }: { children: ReactNode }) {
  const navItems = getNavItems();

  /**
   * Person structured data. Only facts that are already on the page, so
   * there is nothing here a visitor cannot verify by reading it.
   */
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.title,
    email: `mailto:${profile.email}`,
    url: siteConfig.url,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Pune",
      addressRegion: "Maharashtra",
      addressCountry: "IN",
    },
    sameAs: [
      "https://github.com/bhaveshbokde",
      "https://www.linkedin.com/in/bhavesh-bokde",
    ],
    knowsAbout: siteConfig.keywords,
  };

  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen antialiased">
        {/* The first thing in the tab order: a way past the navigation.
            Visually hidden until focused. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:border focus:border-azure-500/60 focus:bg-ink-900 focus:px-4 focus:py-2.5 focus:text-sm focus:text-white"
        >
          Skip to main content
        </a>

        <Aurora />

        <Header
          monogram={profile.monogram}
          name={profile.name}
          navItems={navItems}
          resumePath={siteConfig.resumePath}
          resumeDownloadName={siteConfig.resumeDownloadName}
        />

        <main id="main" tabIndex={-1}>
          {children}
        </main>

        <Footer />

        <script
          type="application/ld+json"
          // Serialised from a literal we control; there is no user input here.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      </body>
    </html>
  );
}
