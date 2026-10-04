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

describe("MailTemplateRenderer.renderNewUserRegistered", () => {
  it("incluye los datos del usuario y escapa el correo", () => {
    const renderer = new MailTemplateRenderer();

    const html = renderer.renderNewUserRegistered({
      user: {
        email: "ana<script>@example.com",
        name: "Ana",
        last_name: "García",
        phone_code: "+34",
        phone: "600000000",
      },
      created_at: "2026-10-03T22:00:00.000Z",
    });

    expect(html).toContain("Nuevo usuario registrado");
    expect(html).toContain("Ana García");
    expect(html).toContain("+34 600000000");
    expect(html).toContain("ana&lt;script&gt;@example.com");
    expect(html).not.toContain("ana<script>@example.com");
  });
});
