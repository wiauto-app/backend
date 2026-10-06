import type { PrepareStepFunction, ToolSet } from "ai";

/**
 * Deja el último paso permitido solo para texto (`toolChoice: "none"`). Sin esto,
 * si el agente agota `stepCountIs(max)` encadenando tools (p. ej. muchas
 * búsquedas relajando filtros), el stream termina sin ninguna respuesta escrita.
 */
export const finalStepWithoutTools =
  <TOOLS extends ToolSet>(maxSteps: number): PrepareStepFunction<TOOLS> =>
  ({ stepNumber }) =>
    stepNumber >= maxSteps - 1 ? { toolChoice: "none" } : undefined;
