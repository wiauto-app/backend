import {
  getToolName,
  isToolUIPart,
  type TextUIPart,
  type UIDataTypes,
  type UIMessage,
  type UIMessagePart,
  type UITools,
} from "ai";

type AnyUIMessagePart = UIMessagePart<UIDataTypes, UITools>;

interface ToolPartDigestOutput {
  total?: number;
  appliedFilters?: unknown;
}

const buildToolDigestText = (part: AnyUIMessagePart): string => {
  const toolName = isToolUIPart(part) ? getToolName(part) : "herramienta";

  if (!("state" in part) || part.state !== "output-available") {
    return `[${toolName}: resultado previo no disponible]`;
  }

  const output = part.output as ToolPartDigestOutput | undefined;
  if (toolName === "searchVehicles" && output && typeof output.total === "number") {
    return `[Búsqueda previa: ${output.total} resultados con filtros: ${JSON.stringify(output.appliedFilters ?? {})}]`;
  }

  return `[${toolName}: resultado previo ya resuelto]`;
};

const toDigestPart = (part: AnyUIMessagePart): TextUIPart => ({
  type: "text",
  text: buildToolDigestText(part),
});

/**
 * Returns a copy of `messages` where every tool-typed part (static or
 * dynamic) is replaced with a short plain-text digest.
 *
 * The final summary `streamText` call in `streamSearchChat` is a plain
 * summarization call with no `tools` option declared -- the `searchVehicles`
 * "tool call" in the stream is faked by the deterministic search pipeline,
 * not the SDK's native tool-calling. When prior turns' persisted
 * `tool-input-available`/`tool-output-available` parts are sent as history
 * without a `tools` schema, DeepSeek has nothing telling it that content is
 * already-resolved structured data, and it can imitate the tool-call format
 * as literal output text (e.g. `<｜DSML｜calls>...`). Flattening tool parts
 * into prose before they reach the model avoids that, while keeping enough
 * context for the model to reference the previous search.
 *
 * This only transforms the payload sent to the LLM. It must never be used
 * for what gets persisted via `saveMessages`, which keeps the full original
 * parts.
 */
export const stripToolPartsForLlm = (messages: UIMessage[]): UIMessage[] =>
  messages.map((message) => {
    const hasToolPart = message.parts.some((part) => isToolUIPart(part));
    if (!hasToolPart) {
      return message;
    }

    const parts: AnyUIMessagePart[] = message.parts.map((part) =>
      isToolUIPart(part) ? toDigestPart(part) : part,
    );

    return { ...message, parts };
  });
