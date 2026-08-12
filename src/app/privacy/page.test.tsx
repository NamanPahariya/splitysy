import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import PrivacyPage from "./page";

describe("privacy page", () => {
  it("clearly identifies its content as a placeholder", () => {
    const html = renderToStaticMarkup(<PrivacyPage />);

    expect(html).toContain("Privacy Policy");
    expect(html).toContain("Placeholder");
    expect(html).toContain("must not be treated as a description");
  });
});
