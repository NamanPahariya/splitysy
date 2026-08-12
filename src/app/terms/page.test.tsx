import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import TermsPage from "./page";

describe("terms page", () => {
  it("clearly identifies its content as a placeholder", () => {
    const html = renderToStaticMarkup(<TermsPage />);

    expect(html).toContain("Terms and Conditions");
    expect(html).toContain("Placeholder");
    expect(html).toContain("must not be treated as legal terms");
  });
});
