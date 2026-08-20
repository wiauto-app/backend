import { describe, expect, it, vi } from "vitest";
import { AssistantSuggestionsService } from "@/src/contexts/assistant/services/assistant-suggestions.service";

const generated = [
  { label: "Idea uno", prompt: "Esta es la primera pregunta sugerida" },
  { label: "Idea dos", prompt: "Esta es la segunda pregunta sugerida" },
  { label: "Idea tres", prompt: "Esta es la tercera pregunta sugerida" },
  { label: "Idea cuatro", prompt: "Esta es la cuarta pregunta sugerida" },
];

describe("AssistantSuggestionsService", () => {
  it("reutiliza el cache global de la ruta", async () => {
    const cache = {
      get: vi.fn().mockResolvedValue(generated),
      set: vi.fn(),
    };
    const generator = { generate: vi.fn() };
    const service = new AssistantSuggestionsService(cache as never, generator as never);

    const result = await service.getForRoute("/vehiculos");

    expect(result.context).toBe("vehicles");
    expect(result.suggestions).toEqual(generated);
    expect(cache.get).toHaveBeenCalledWith("assistant:suggestions:v1:/vehiculos");
    expect(generator.generate).not.toHaveBeenCalled();
  });

  it("genera una sola vez para dos misses simultáneos y guarda por dos semanas", async () => {
    const cache = { get: vi.fn().mockResolvedValue(undefined), set: vi.fn() };
    const generator = { generate: vi.fn().mockResolvedValue(generated) };
    const service = new AssistantSuggestionsService(cache as never, generator as never);

    const [first, second] = await Promise.all([
      service.getForRoute("/noticias"),
      service.getForRoute("/noticias"),
    ]);

    expect(first.suggestions).toEqual(generated);
    expect(second.suggestions).toEqual(generated);
    expect(generator.generate).toHaveBeenCalledTimes(1);
    expect(cache.set).toHaveBeenCalledWith(
      "assistant:suggestions:v1:/noticias",
      generated,
      14 * 24 * 60 * 60 * 1000,
    );
  });
});
