import { GenerationSettingsDto } from "../dto/vehicle-ai-context.dto";

const OBJECTIVE_INSTRUCTIONS: Record<string, string> = {
  family: "familias (espacio, seguridad y practicidad diaria)",
  young: "jóvenes (estilo, agilidad y buen precio)",
  "first-car": "compradores de su primer vehículo (fiabilidad y facilidad de uso)",
  business: "empresarios y uso profesional (imagen y confort)",
  uber: "conductores de Uber o VTC (economía, confort y kilometraje)",
  adventurer: "aventureros (versatilidad, capacidad y salidas de ruta)",
  "fuel-saver": "personas que buscan ahorrar combustible (eficiencia y consumo)",
  collector: "coleccionistas (rareza, estado y valor de conservación)",
  athlete: "deportistas (dinamismo, rendimiento y carácter deportivo)",
  anyone: "público general",
};

const PERSUASION_INSTRUCTIONS: Record<string, string> = {
  informative: "informativo (prioriza datos claros; evita presión de venta)",
  balanced: "balanceado (informa y destaca beneficios sin exagerar)",
  persuasive: "persuasivo (destaca beneficios sin exagerar)",
  "very-seller": "muy vendedor (énfasis comercial fuerte, sin inventar ni mentir)",
};

const EXTENSION_INSTRUCTIONS: Record<string, string> = {
  "very-short": "muy corta (1-2 líneas; sin secciones largas)",
  short: "corta (50-80 palabras; estructura mínima)",
  medium: "media (100-150 palabras)",
  long: "larga (200-300 palabras; permite secciones)",
  "very-detailed":
    "muy detallada (desarrolla secciones con más detalle; sigue sin inventar datos)",
};

const TONE_INSTRUCTIONS: Record<string, string> = {
  formal: "formal",
  professional: "profesional",
  casual: "casual",
  close: "cercano",
  friendly: "amigable",
  enthusiastic: "entusiasta",
  elegant: "elegante",
  premium: "premium",
  sporty: "deportivo",
  persuasive: "persuasivo",
  urgent: "urgente",
  exclusive: "exclusivo",
};

const DEFAULT_OBJECTIVE = "público general";
const DEFAULT_PERSUASION =
  "balanceado (informa y destaca beneficios sin exagerar)";
const DEFAULT_EXTENSION = "media (100-150 palabras)";
const DEFAULT_TONE = "profesional cercano";

export interface MappedDescriptionSettings {
  preferences_block: string;
  extension_code: string;
  is_very_short: boolean;
  is_short: boolean;
}

const resolve_instruction = (
  code: string | null | undefined,
  map: Record<string, string>,
  fallback: string,
): string => {
  if (!code) {
    return fallback;
  }

  return map[code] ?? fallback;
};

export const mapDescriptionGenerationSettings = (
  settings?: GenerationSettingsDto,
): MappedDescriptionSettings => {
  const objective = resolve_instruction(
    settings?.objective,
    OBJECTIVE_INSTRUCTIONS,
    DEFAULT_OBJECTIVE,
  );
  const persuasion = resolve_instruction(
    settings?.persuasion,
    PERSUASION_INSTRUCTIONS,
    DEFAULT_PERSUASION,
  );
  const extension = resolve_instruction(
    settings?.extension,
    EXTENSION_INSTRUCTIONS,
    DEFAULT_EXTENSION,
  );
  const tone = resolve_instruction(
    settings?.tone,
    TONE_INSTRUCTIONS,
    DEFAULT_TONE,
  );

  const extension_code = settings?.extension ?? "medium";

  const preferences_block = `## Preferencias del vendedor
- Público objetivo: ${objective}
- Nivel de persuasión: ${persuasion}
- Extensión: ${extension}
- Tono: ${tone}`;

  return {
    preferences_block,
    extension_code,
    is_very_short: extension_code === "very-short",
    is_short: extension_code === "short",
  };
};
