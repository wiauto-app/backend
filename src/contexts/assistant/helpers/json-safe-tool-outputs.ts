import type { ToolSet } from "ai";

/**
 * Copia en JSON plano: `Date` → string ISO, se eliminan `undefined`, funciones y
 * prototipos de entidades.
 */
export const toJsonSafe = <T>(value: T): T =>
  value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T);

/**
 * Envuelve el `execute` de cada tool para que su salida sea JSON plano.
 *
 * El AI SDK valida el historial de cada paso del agente contra `ModelMessage[]`,
 * cuyo `tool-result` exige JSON estricto. Un `Date` dentro de la salida (p. ej.
 * `created_at` de un vehículo) hace fallar ese paso con `AI_InvalidPromptError` y
 * corta el stream con "An error occurred." justo después de la tool.
 */
export const withJsonSafeToolOutputs = <T extends ToolSet>(tools: T): T =>
  Object.fromEntries(
    Object.entries(tools).map(([name, definition]) => {
      const execute = definition.execute;
      if (!execute) {
        return [name, definition];
      }

      return [
        name,
        {
          ...definition,
          execute: async (input: unknown, options: unknown) =>
            toJsonSafe(
              await (execute as (input: unknown, options: unknown) => Promise<unknown>)(
                input,
                options,
              ),
            ),
        },
      ];
    }),
  ) as T;
