import type { SocialLink } from "./types";

/**
 * Social and contact links.
 *
 * A link with no `url` is not rendered as a dead anchor. It is rendered as a
 * disabled chip reading "not configured", so an unfinished profile is obvious
 * to you in development and harmless to a visitor in production.
 *
 * ## Adding a link
 *
 *   {
 *     id: "stackoverflow",
 *     label: "Stack Overflow",
 *     url: "https://stackoverflow.com/users/0000000",
 *     icon: "MessageSquareCode",   // any lucide-react icon name
 *     handle: "bhavesh",           // optional
 *     showInHero: false,
 *   }
 *
 * `icon` accepts any icon exported by `lucide-react`, plus the custom
 * `GitHub` and `LinkedIn` marks defined in `src/components/ui/Icon.tsx`. An
 * unknown name falls back to a neutral link glyph rather than crashing.
 */
export const socialLinks: SocialLink[] = [
  {
    id: "github",
    label: "GitHub",
    url: "https://github.com/bhaveshbokde",
    icon: "GitHub",
    handle: "@bhaveshbokde",
    showInHero: true,
    showInFooter: true,
    order: 1,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    url: "https://www.linkedin.com/in/bhavesh-bokde",
    icon: "LinkedIn",
    handle: "bhavesh-bokde",
    showInHero: true,
    showInFooter: true,
    order: 2,
  },
  {
    id: "email",
    label: "Email",
    url: "mailto:bhaveshbokde@gmail.com",
    icon: "Mail",
    handle: "bhaveshbokde@gmail.com",
    showInHero: false,
    showInFooter: true,
    order: 3,
  },
];
