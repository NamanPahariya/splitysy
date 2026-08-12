import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "font-geist-sans" }),
  Geist_Mono: () => ({ variable: "font-geist-mono" }),
}));

import RootLayout from "./layout";

describe("root layout", () => {
  it("places the global footer after flexible page content", () => {
    const html = renderToStaticMarkup(
      <RootLayout params={Promise.resolve({})}>
        <main className="flex-1">Page content</main>
      </RootLayout>,
    );

    expect(html).toContain('class="flex min-h-full flex-col"');
    expect(html.indexOf("Page content")).toBeLessThan(html.indexOf("<footer"));
    expect(html).toContain("Terms and Conditions");
    expect(html).toContain("Privacy Policy");
  });
});
