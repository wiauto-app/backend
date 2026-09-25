import { describe, expect, it } from "vitest";

import { mapDescriptionGenerationSettings } from "@/src/contexts/vehicles/services/description-generation-settings.mapper";

describe("mapDescriptionGenerationSettings", () => {
  it("incluye objetivo, persuasión, extensión y tono en el bloque de preferencias", () => {
    const mapped = mapDescriptionGenerationSettings({
      objective: "family",
      persuasion: "informative",
      extension: "short",
      tone: "formal",
    });

    expect(mapped.preferences_block).toContain("familias");
    expect(mapped.preferences_block).toContain("informativo");
    expect(mapped.preferences_block).toContain("corta");
    expect(mapped.preferences_block).toContain("formal");
    expect(mapped.extension_code).toBe("short");
    expect(mapped.is_short).toBe(true);
    expect(mapped.is_very_short).toBe(false);
  });

  it("usa valores por defecto cuando faltan códigos", () => {
    const mapped = mapDescriptionGenerationSettings(undefined);

    expect(mapped.preferences_block).toContain("público general");
    expect(mapped.preferences_block).toContain("balanceado");
    expect(mapped.extension_code).toBe("medium");
  });
});
