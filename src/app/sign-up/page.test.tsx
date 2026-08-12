import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import SignUpPage from "./page";

describe("sign-up page", () => {
  it("renders the account requirements and fields", () => {
    const html = renderToStaticMarkup(<SignUpPage />);

    expect(html).toContain("Create your account");
    expect(html).toContain("Display name");
    expect(html).toContain("Email address");
    expect(html).toContain("Password");
    expect(html).toContain("minLength=\"10\"");
    expect(html).toContain("No other rules apply.");
    expect(html).toContain("do not need to confirm your email address");
  });
});
