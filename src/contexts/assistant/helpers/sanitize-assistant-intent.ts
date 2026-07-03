import type { AssistantIntent } from "../types/assistant-intent";

const normalizeForMatch = (text: string): string =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");

const toSingular = (value: string): string => {
  if (value.length <= 3) {
    return value;
  }

  if (value.endsWith("es") && value.length > 4) {
    return value.slice(0, -2);
  }

  if (value.endsWith("s")) {
    return value.slice(0, -1);
  }

  return value;
};

export const isEntityMentionedInMessage = (
  entityValue: string,
  userMessage: string,
): boolean => {
  const normalizedMessage = normalizeForMatch(userMessage);
  const normalizedEntity = normalizeForMatch(entityValue.trim());

  if (!normalizedEntity) {
    return false;
  }

  if (normalizedMessage.includes(normalizedEntity)) {
    return true;
  }

  const singularEntity = toSingular(normalizedEntity);
  if (
    singularEntity !== normalizedEntity &&
    normalizedMessage.includes(singularEntity)
  ) {
    return true;
  }

  const words = normalizedEntity.split(/\s+/).filter((word) => word.length > 2);
  if (words.length > 1) {
    return words.every((word) => normalizedMessage.includes(word));
  }

  return normalizedMessage.includes(toSingular(normalizedEntity));
};

export const sanitizeAssistantIntent = (
  intent: AssistantIntent,
  userMessage: string,
): AssistantIntent => {
  const next: AssistantIntent = { ...intent };

  if (next.make && !isEntityMentionedInMessage(next.make, userMessage)) {
    delete next.make;
  }

  if (next.model && !isEntityMentionedInMessage(next.model, userMessage)) {
    delete next.model;
  }

  if (
    next.vehicle_type &&
    !isEntityMentionedInMessage(next.vehicle_type, userMessage)
  ) {
    delete next.vehicle_type;
  }

  return next;
};
