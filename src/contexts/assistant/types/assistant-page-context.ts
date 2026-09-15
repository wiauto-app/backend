export const ASSISTANT_PAGE_ROUTES = [
  "/",
  "/vehiculos",
  "/concesionarios",
  "/noticias",
] as const;

export type AssistantPageRoute = (typeof ASSISTANT_PAGE_ROUTES)[number];

export const ASSISTANT_PAGE_CONTEXTS = [
  "home",
  "vehicles",
  "dealerships",
  "news",
] as const;

export type AssistantPageContext = (typeof ASSISTANT_PAGE_CONTEXTS)[number];

const CONTEXT_BY_ROUTE: Record<AssistantPageRoute, AssistantPageContext> = {
  "/": "home",
  "/vehiculos": "vehicles",
  "/concesionarios": "dealerships",
  "/noticias": "news",
};

export const resolveAssistantPageContext = (
  route: AssistantPageRoute,
): AssistantPageContext => CONTEXT_BY_ROUTE[route];
