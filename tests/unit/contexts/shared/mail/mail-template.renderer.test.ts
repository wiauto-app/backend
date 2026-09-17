import { describe, expect, it } from "vitest";

import { MailTemplateRenderer } from "@/src/contexts/shared/mail/mail-template.renderer";

describe("MailTemplateRenderer.renderNewsletterSubscribed", () => {
  it("envuelve el body con base-email.html y escapa el email", () => {
    const renderer = new MailTemplateRenderer();

    const html = renderer.renderNewsletterSubscribed({
      email: "<user@example.com>",
    });

    expect(html).toContain("Suscripción confirmada");
    expect(html).toContain("&lt;user@example.com&gt;");
    expect(html).not.toContain("<user@example.com>");
  });
});
