import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Footer } from "./footer";

describe("Footer", () => {
  it("renders the product identity in the page footer", () => {
    const html = renderToStaticMarkup(<Footer />);

    expect(html).toContain("<footer");
    expect(html).toContain("Splitsy");
    expect(html).toContain("Shared expenses, settled simply.");
  });

  it("provides a labeled legal navigation with both policy links", () => {
    const html = renderToStaticMarkup(<Footer />);

    expect(html).toContain('aria-label="Legal"');
    expect(html).toMatch(/<nav[^>]*>[\s\S]*<ul[^>]*>[\s\S]*<li>/);
    expect(html).toContain('href="/terms"');
    expect(html).toContain("Terms and Conditions");
    expect(html).toContain('href="/privacy"');
    expect(html).toContain("Privacy Policy");
  });
});
