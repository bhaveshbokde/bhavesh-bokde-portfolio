/**
 * A restrained data-flow backdrop for the case-study hero.
 *
 * Pure CSS and static SVG — no canvas, no JavaScript, no animation loop. The
 * only motion is three `stroke-dashoffset` dashes travelling along fixed
 * paths, which the compositor handles on its own.
 *
 * Deliberately quieter than the home-page particle field. This page asks the
 * reader to follow a ten-stage protocol through three diagram views; a busy
 * background competing for attention would actively work against that. It is
 * texture, not a feature.
 *
 * `data-motion="decorative"` lets the reduced-motion rule in `globals.css`
 * remove the moving layer outright while the gradient wash stays.
 */
export function FlowBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 20% 0%, rgb(59 125 245 / 0.11), transparent 70%)," +
            "radial-gradient(ellipse 55% 50% at 85% 20%, rgb(139 92 246 / 0.10), transparent 70%)",
        }}
      />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1200 420"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="fb-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3b7df5" stopOpacity="0" />
            <stop offset="45%" stopColor="#5b9cff" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#a98bff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[
          { d: "M -60 90 C 300 50, 640 150, 1260 100", delay: "0s" },
          { d: "M -60 210 C 340 170, 700 260, 1260 200", delay: "2.4s" },
          { d: "M -60 330 C 280 300, 720 370, 1260 320", delay: "4.8s" },
        ].map((path, index) => (
          <g key={index}>
            <path
              d={path.d}
              fill="none"
              stroke="url(#fb-line)"
              strokeWidth="1.1"
              opacity="0.5"
            />
            <path
              data-motion="decorative"
              d={path.d}
              fill="none"
              stroke="#8ab8ff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="3 320"
              className="animate-dash"
              style={{ animationDuration: "7.2s", animationDelay: path.delay }}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
