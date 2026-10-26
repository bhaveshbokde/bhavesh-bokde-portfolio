/**
 * The page backdrop: a fine grid, three slow-drifting colour fields, and a
 * vignette that pulls the edges back down to near-black.
 *
 * Entirely CSS. No canvas, no WebGL, no particle library, no image request —
 * which is why it costs nothing on a low-powered phone and degrades to a flat
 * dark background if anything is unsupported.
 *
 * It is a server component with no JavaScript at all. `data-motion="decorative"`
 * lets the reduced-motion rule in `globals.css` remove the moving layers
 * outright; the static grid and vignette stay, so the page keeps its depth.
 */
export function Aurora() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Base wash */}
      <div className="absolute inset-0 bg-ink-950" />

      {/* Fine grid, faded out towards the bottom so it never competes with
          the content it sits behind. */}
      <div
        className="bg-grid absolute inset-0 opacity-[0.45]"
        style={{
          maskImage:
            "radial-gradient(ellipse 120% 70% at 50% 0%, #000 20%, transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 120% 70% at 50% 0%, #000 20%, transparent 78%)",
        }}
      />

      {/* Drifting colour fields. Heavily blurred and low-opacity: at these
          values they read as lighting rather than as shapes. */}
      <div
        data-motion="decorative"
        className="animate-drift absolute -top-[22rem] -left-[18rem] h-[42rem] w-[42rem] rounded-full opacity-[0.22] blur-[130px] will-change-transform"
        style={{
          background:
            "radial-gradient(circle, var(--color-azure-500) 0%, transparent 68%)",
        }}
      />
      <div
        data-motion="decorative"
        className="animate-drift-slow absolute -top-[14rem] right-[-14rem] h-[38rem] w-[38rem] rounded-full opacity-[0.20] blur-[140px] will-change-transform"
        style={{
          background:
            "radial-gradient(circle, var(--color-iris-500) 0%, transparent 68%)",
        }}
      />
      <div
        data-motion="decorative"
        className="animate-pulse-glow absolute top-[48%] left-[42%] h-[34rem] w-[34rem] rounded-full opacity-[0.10] blur-[150px] will-change-[opacity]"
        style={{
          background:
            "radial-gradient(circle, var(--color-aqua-400) 0%, transparent 70%)",
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 80% at 50% 0%, transparent 35%, var(--color-ink-950) 100%)",
        }}
      />
    </div>
  );
}
