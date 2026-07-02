import type { UIMessage } from "ai";
import { extractLastUserMessage } from "./extract-last-user-message";

const MAX_TITLE_LENGTH = 60;

export const buildConversationTitle = (messages: UIMessage[]): string => {
  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index];
    if (message.role !== "user") {
      continue;
    }

    const text = message.parts
      .filter(
        (part): part is { type: "text"; text: string } => part.type === "text",
      )
      .map((part) => part.text)
      .join("")
      .trim();

    if (text.length === 0) {
      continue;
    }

    if (text.length <= MAX_TITLE_LENGTH) {
      return text;
    }

    return `${text.slice(0, MAX_TITLE_LENGTH - 1).trim()}…`;
  }

  const fallback = extractLastUserMessage(messages);
  if (fallback.length === 0) {
    return "Nueva conversación";
  }

  if (fallback.length <= MAX_TITLE_LENGTH) {
    return fallback;
  }

  return `${fallback.slice(0, MAX_TITLE_LENGTH - 1).trim()}…`;
};
