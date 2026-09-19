import { getToolName, isToolUIPart, type UIMessage } from "ai";
import type { SearchVehiclesInput } from "../schemas/search-vehicles.schema";

const SEARCH_VEHICLES_TOOL_NAME = "searchVehicles";

interface SearchVehiclesToolOutput {
  appliedFilters?: SearchVehiclesInput;
}

/**
 * Looks back through the conversation history for the most recent
 * `searchVehicles` tool part (the one `streamSearchChat` fakes into the SSE
 * stream every turn) and returns the filters it applied.
 *
 * This is what lets multi-turn follow-ups ("en Zaragoza", "y de gasolina")
 * build on top of the previous turn's filters instead of replacing them:
 * intent extraction only ever looks at the newest user message, so without
 * this the earlier turns' filters would simply be lost.
 */
export const extractPreviousSearchFilters = (
  messages: UIMessage[],
): SearchVehiclesInput | undefined => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role !== "assistant") {
      continue;
    }

    for (
      let partIndex = message.parts.length - 1;
      partIndex >= 0;
      partIndex -= 1
    ) {
      const part = message.parts[partIndex];
      if (!isToolUIPart(part) || getToolName(part) !== SEARCH_VEHICLES_TOOL_NAME) {
        continue;
      }

      if (part.state === "output-available") {
        const output = part.output as SearchVehiclesToolOutput | undefined;
        if (output?.appliedFilters) {
          return output.appliedFilters;
        }
      }

      if ("input" in part && part.input) {
        return part.input as SearchVehiclesInput;
      }

      return undefined;
    }
  }

  return undefined;
};
