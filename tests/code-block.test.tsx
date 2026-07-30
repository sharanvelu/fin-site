/**
 * Component tests for CodeBlock — the in-repo, dependency-free code renderer
 * and its token highlighter (bash/dotenv prompts, comments, `fin` accents).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CodeBlock } from "@/components/CodeBlock";

afterEach(cleanup);

describe("CodeBlock", () => {
  it("renders every line of the code", () => {
    render(<CodeBlock code={"fin up\nfin ps -a"} />);
    expect(screen.getAllByText("fin")).toHaveLength(2);
    expect(screen.getByText("up")).toBeDefined();
    expect(screen.getByText("ps")).toBeDefined();
  });

  it("shows a header with the filename when given, falling back to lang", () => {
    const { rerender } = render(
      <CodeBlock code="x" lang="bash" filename=".env" />,
    );
    expect(screen.getByText(".env")).toBeDefined();
    rerender(<CodeBlock code="x" lang="bash" />);
    expect(screen.getByText("bash")).toBeDefined();
  });

  it("renders no header without lang or filename", () => {
    const { container } = render(<CodeBlock code="plain" />);
    expect(container.querySelector(".border-b")).toBeNull();
  });

  it("prefixes non-empty, non-comment lines with a $ prompt", () => {
    render(<CodeBlock code={"fin up\n\n# comment"} prompt />);
    expect(screen.getAllByText("$")).toHaveLength(1);
  });

  it("styles comment lines as faint", () => {
    render(<CodeBlock code="# a comment" />);
    expect(screen.getByText("# a comment").className).toContain(
      "text-fg-faint",
    );
  });

  it("accents the fin command and flags in shell code", () => {
    render(<CodeBlock code="fin ps -a" />);
    expect(screen.getByText("fin").className).toContain("text-accent");
    expect(screen.getByText("-a").className).toContain("text-term-yellow");
  });

  it("splits dotenv lines into key and value tokens", () => {
    render(<CodeBlock code="FIN_APP=laravel" lang="dotenv" />);
    expect(screen.getByText("FIN_APP").className).toContain("text-term-cyan");
    expect(screen.getByText("laravel").className).toContain("text-term-green");
  });

  it("highlights python keywords and class names", () => {
    render(<CodeBlock code="class FinPlug:" lang="python" />);
    expect(screen.getByText("class").className).toContain("text-term-magenta");
    expect(screen.getByText("FinPlug").className).toContain("text-term-cyan");
  });

  it("copies the full code to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });

    render(<CodeBlock code={"fin up\nfin down"} />);
    fireEvent.click(screen.getByLabelText("Copy code"));

    expect(writeText).toHaveBeenCalledWith("fin up\nfin down");
    vi.unstubAllGlobals();
  });
});
