/**
 * A static terminal mockup that reproduces real `fin up` / `fin ps` output,
 * styled to match Fin's Rich CLI (cyan accents, green checkmarks, grouped ps).
 */

type Line = { text: string; tone?: "ok" | "muted" | "accent" | "cmd" | "head" };

const LINES: Line[] = [
  { text: "$ fin up", tone: "cmd" },
  { text: "✓ Started fin_proxy (traefik) — dashboard at http://traefik.localhost", tone: "ok" },
  { text: "✓ Started fin_mysql (mysql:8.0)", tone: "ok" },
  { text: "✓ Started myapp-web (php:8.3)", tone: "ok" },
  { text: "✓ Database myapp is ready (MySQL).", tone: "ok" },
  { text: "✓ myapp is up at http://myapp.localhost", tone: "ok" },
];

function toneClass(tone?: Line["tone"]) {
  switch (tone) {
    case "ok":
      return "text-term-green";
    case "muted":
      return "text-fg-faint";
    case "accent":
      return "text-accent";
    case "cmd":
      return "text-fg";
    case "head":
      return "text-term-red";
    default:
      return "text-fg-muted";
  }
}

export function Terminal() {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-bg-soft shadow-2xl shadow-black/40">
      <div className="flex items-center gap-2 border-b border-border-soft px-4 py-3">
        <span className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-term-red/80" />
          <span className="h-3 w-3 rounded-full bg-term-yellow/80" />
          <span className="h-3 w-3 rounded-full bg-term-green/80" />
        </span>
        <span className="ml-2 font-mono text-xs text-fg-faint">~/projects/myapp — fin</span>
      </div>
      <pre className="overflow-x-auto px-5 py-4 font-mono text-[13px] leading-relaxed">
        {LINES.map((l, i) => (
          <div key={i} className={toneClass(l.tone)}>
            {l.tone === "ok" ? (
              <>
                <span className="text-term-green">✓</span>
                {l.text.slice(1)}
              </>
            ) : l.tone === "cmd" ? (
              <>
                <span className="text-accent">$</span>
                <span className="text-fg">{l.text.slice(1)}</span>
              </>
            ) : (
              l.text
            )}
          </div>
        ))}
        <div className="text-fg">
          <span className="text-accent">$</span>
          <span className="cursor-blink ml-1 inline-block h-4 w-2 translate-y-0.5 bg-accent" />
        </div>
      </pre>
    </div>
  );
}
