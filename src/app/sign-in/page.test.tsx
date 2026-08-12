import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import SignInPage from "./page";

describe("sign-in page", () => {
  it("renders the email and password sign-in fields", () => {
    const html = renderToStaticMarkup(<SignInPage />);

    expect(html).toContain("Welcome back");
    expect(html).toContain("Email address");
    expect(html).toContain("Password");
    expect(html).toContain("current-password");
    expect(html).toContain("Create an account");
    expect(html).not.toContain("Display name");
  });
});
