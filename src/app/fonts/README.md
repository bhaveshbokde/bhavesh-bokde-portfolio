# Bundled fonts

Three variable fonts, latin subset only, self-hosted rather than fetched from
Google Fonts at build time. Together they are about 102 KB.

Self-hosting is deliberate:

- `next build` needs no network access, so a fresh clone builds offline and a
  CI runner without egress is not a problem.
- No third-party request from a visitor's browser, so nothing to block and no
  extra DNS lookup before text can paint.
- The exact bytes are pinned in git, so the site cannot change appearance
  because an upstream CDN rolled a new font version.

| File | Family | Licence | Copyright |
|---|---|---|---|
| `inter-latin-var.woff2` | Inter | SIL Open Font License 1.1 | The Inter Project Authors (<https://github.com/rsms/inter>) |
| `space-grotesk-latin-var.woff2` | Space Grotesk | SIL Open Font License 1.1 | Florian Karsten (<https://github.com/floriankarsten/space-grotesk>) |
| `jetbrains-mono-latin-var.woff2` | JetBrains Mono | SIL Open Font License 1.1 | The JetBrains Mono Project Authors (<https://github.com/JetBrains/JetBrainsMono>) |

The licence text is in [`OFL-1.1.txt`](./OFL-1.1.txt). All three fonts permit
redistribution and web embedding, including in a bundled application, provided
the licence travels with them — which is what this directory does.

## Replacing a font

1. Drop the new `.woff2` in here.
2. Point the matching `localFont({ src: … })` call in `src/app/layout.tsx` at it.
3. Update the table above and keep the licence file accurate.

The CSS variables (`--font-sans`, `--font-display`, `--font-mono`) are wired in
`src/app/globals.css`, so nothing else needs to change.
