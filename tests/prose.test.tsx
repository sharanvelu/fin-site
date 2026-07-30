/**
 * Component tests for the Prose building blocks every docs page is
 * composed from (headers, callouts, tables, pager).
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import {
  Callout,
  Code,
  H2,
  PageHeader,
  Pager,
  RefTable,
} from "@/components/Prose";

afterEach(cleanup);

describe("PageHeader", () => {
  it("renders the title as an h1 with an optional lead", () => {
    render(<PageHeader title="Plugs" lead="What a plug is." />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Plugs");
    expect(screen.getByText("What a plug is.")).toBeDefined();
  });
});

describe("H2", () => {
  it("renders an anchored heading linking to its own id", () => {
    render(<H2 id="types">The three plug types</H2>);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading.id).toBe("types");
    expect(screen.getByLabelText("Link to section").getAttribute("href")).toBe(
      "#types",
    );
  });
});

describe("Callout", () => {
  it.each([
    ["info", "ℹ"],
    ["warn", "⚠"],
    ["tip", "✓"],
  ] as const)("renders the %s kind with its marker", (kind, dot) => {
    render(
      <Callout kind={kind} title="Heads up">
        Body text
      </Callout>,
    );
    expect(screen.getByText(dot)).toBeDefined();
    expect(screen.getByText("Heads up")).toBeDefined();
    expect(screen.getByText("Body text")).toBeDefined();
  });
});

describe("RefTable", () => {
  it("renders one column per head and one row per entry", () => {
    render(
      <RefTable
        head={["Code", "Meaning"]}
        rows={[
          ["0", "Success"],
          ["1", "User error"],
        ]}
      />,
    );
    expect(screen.getAllByRole("columnheader")).toHaveLength(2);
    expect(screen.getAllByRole("row")).toHaveLength(3); // head + 2 rows
    expect(screen.getByText("User error")).toBeDefined();
  });
});

describe("Code", () => {
  it("renders inline code", () => {
    render(<Code>fin up</Code>);
    expect(screen.getByText("fin up").tagName).toBe("CODE");
  });
});

describe("Pager", () => {
  it("links to prev and next pages", () => {
    render(
      <Pager
        prev={{ title: "Plugs", href: "/docs/plugs" }}
        next={{ title: "Commands", href: "/docs/commands" }}
      />,
    );
    expect(screen.getByText("Plugs").closest("a")?.getAttribute("href")).toBe(
      "/docs/plugs",
    );
    expect(
      screen.getByText("Commands").closest("a")?.getAttribute("href"),
    ).toBe("/docs/commands");
  });

  it("renders a spacer instead of a link when a side is missing", () => {
    const { container } = render(
      <Pager next={{ title: "Commands", href: "/docs/commands" }} />,
    );
    expect(container.querySelectorAll("a")).toHaveLength(1);
  });
});
