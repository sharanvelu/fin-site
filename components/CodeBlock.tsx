"use client";

import { useState } from "react";
import { Icon } from "./icons";

type CodeBlockProps = {
  code: string;
  /** Optional language label shown in the header (e.g. "bash", "python"). */
  lang?: string;
  /** Optional filename shown in the header. */
  filename?: string;
  /** Render a leading "$" prompt on each non-empty line (for shell snippets). */
  prompt?: boolean;
};

/**
 * A copyable code block with a header bar. Lightweight token highlighting is
 * applied for shell and python without pulling in a syntax-highlighter dep.
 */
export function CodeBlock({ code, lang, filename, prompt }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — no-op */
    }
  }

  return (
    <div className="group relative my-5 overflow-hidden rounded-card border border-border bg-bg-soft">
      {(lang || filename) && (
        <div className="flex items-center justify-between border-b border-border-soft px-4 py-2">
          <div className="flex items-center gap-2 text-xs text-fg-faint">
            <span className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-term-red/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-term-yellow/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-term-green/70" />
            </span>
            <span className="ml-2 font-mono">{filename ?? lang}</span>
          </div>
        </div>
      )}
      <button
        onClick={copy}
        aria-label="Copy code"
        className="absolute right-2 top-2 z-10 rounded-md border border-border bg-panel p-1.5 text-fg-faint opacity-0 transition hover:border-accent hover:text-accent group-hover:opacity-100"
        style={{ top: lang || filename ? "0.65rem" : "0.5rem" }}
      >
        {copied ? (
          <Icon.check className="h-4 w-4 text-term-green" />
        ) : (
          <Icon.copy className="h-4 w-4" />
        )}
      </button>
      <pre className="overflow-x-auto px-4 py-4 text-[13px] leading-relaxed">
        <code className="font-mono">
          {code.split("\n").map((line, i) => (
            <Line key={i} line={line} lang={lang} prompt={prompt} />
          ))}
        </code>
      </pre>
    </div>
  );
}

function Line({
  line,
  lang,
  prompt,
}: {
  line: string;
  lang?: string;
  prompt?: boolean;
}) {
  const showPrompt = prompt && line.trim().length > 0 && !line.startsWith("#");
  return (
    <div className="whitespace-pre">
      {showPrompt && <span className="select-none text-accent">$ </span>}
      {highlight(line, lang)}
    </div>
  );
}

/** Minimal, dependency-free token coloring for bash/python/dotenv. */
function highlight(line: string, lang?: string) {
  // Comments
  if (line.trim().startsWith("#")) {
    return <span className="text-fg-faint">{line}</span>;
  }

  if (lang === "dotenv" || lang === "ini") {
    const eq = line.indexOf("=");
    if (eq > 0) {
      return (
        <>
          <span className="text-term-cyan">{line.slice(0, eq)}</span>
          <span className="text-fg-faint">=</span>
          <span className="text-term-green">{line.slice(eq + 1)}</span>
        </>
      );
    }
  }

  if (lang === "python") {
    return pythonHighlight(line);
  }

  // bash / generic: color the `fin` command and flags
  const parts = line.split(/(\s+)/);
  return parts.map((tok, i) => {
    if (tok === "fin")
      return (
        <span key={i} className="text-accent font-semibold">
          {tok}
        </span>
      );
    if (tok.startsWith("-"))
      return (
        <span key={i} className="text-term-yellow">
          {tok}
        </span>
      );
    return <span key={i}>{tok}</span>;
  });
}

const PY_KEYWORDS = new Set([
  "from",
  "import",
  "class",
  "def",
  "return",
  "if",
  "else",
  "elif",
  "for",
  "in",
  "not",
  "and",
  "or",
  "None",
  "True",
  "False",
  "self",
  "list",
  "str",
  "int",
]);

function pythonHighlight(line: string) {
  const tokens = line.split(/(\s+|[(){}\[\],:."'])/);
  return tokens.map((tok, i) => {
    if (PY_KEYWORDS.has(tok))
      return (
        <span key={i} className="text-term-magenta">
          {tok}
        </span>
      );
    if (/^["'].*["']$/.test(tok))
      return (
        <span key={i} className="text-term-green">
          {tok}
        </span>
      );
    if (/^[A-Z][A-Za-z0-9_]+$/.test(tok))
      return (
        <span key={i} className="text-term-cyan">
          {tok}
        </span>
      );
    return <span key={i}>{tok}</span>;
  });
}
