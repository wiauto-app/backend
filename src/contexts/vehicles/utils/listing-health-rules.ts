import { CONDITION_VEHICLE, type ConditionVehicle } from "../types/vehicle";
import {
  CHECK_SEVERITY,
  CHECK_STATUS,
  FEATURED_RECOMMENDATION,
  LISTING_CHECK_CODE,
  LISTING_EDIT_TARGET,
  PRICE_VERDICT,
  type CheckSeverity,
  type FeaturedRecommendation,
  type ListingCheck,
  type ListingHealth,
  type OwnerListingHealthSummary,
  type PriceVerdict,
} from "../types/vehicle-insights";
import { resolveQualityTier } from "./owner-dashboard-rules";

export const LISTING_HEALTH_RULES_VERSION = 1;

export const LISTING_HEALTH_WEIGHTS = {
  photos_count: 30,
  description_length: 20,
  price_position: 25,
  missing_mileage: 7,
  missing_color: 5,
  missing_category: 5,
  missing_dgt_label: 3,
  equipment_count: 5,
} as const;

export const LISTING_HEALTH_MAX_ACTIONS = 3;
export const PHOTOS_RECOMMENDED_COUNT = 8;
export const DESCRIPTION_RECOMMENDED_LENGTH = 300;
export const DESCRIPTION_MIN_LENGTH = 120;
export const EQUIPMENT_RECOMMENDED_COUNT = 3;
export const FEATURED_RECOMMENDED_MIN_SCORE = 75;
export const FEATURED_FIX_FIRST_MAX_SCORE = 50;

const SEVERITY_RANK: Record<CheckSeverity, number> = {
  [CHECK_SEVERITY.CRITICAL]: 0,
  [CHECK_SEVERITY.HIGH]: 1,
  [CHECK_SEVERITY.MEDIUM]: 2,
  [CHECK_SEVERITY.LOW]: 3,
};

export interface ListingHealthInput {
  photos_count: number;
  description: string | null;
  price: number;
  /** null cuando no hay datos de mercado (check de precio `unknown`). */
  price_verdict: PriceVerdict | null;
  price_deviation_percent: number | null;
  mileage: number;
  condition: ConditionVehicle;
  color_id: string | null;
  category_id: string | null;
  dgt_label_id: string | null;
  features_count: number;
  /** Mediana de fotos en anuncios activos del segmento, si se conoce. */
  segment_median_photos: number | null;
}

const pass_check = (
  code: ListingCheck["code"],
  weight: number,
  title: string,
  description: string,
  meta?: ListingCheck["meta"],
): ListingCheck => ({
  code,
  status: CHECK_STATUS.PASS,
  severity: null,
  weight,
  points: weight,
  title,
  description,
  cta: null,
  ...(meta ? { meta } : {}),
});

const build_photos_check = (input: ListingHealthInput): ListingCheck => {
  const weight = LISTING_HEALTH_WEIGHTS.photos_count;
  const count = Math.max(0, input.photos_count);
  const segment_median =
    input.segment_median_photos !== null && input.segment_median_photos > 0
      ? Math.round(input.segment_median_photos)
      : null;
  const meta = { photos_count: count, segment_median_photos: segment_median };

  if (count >= PHOTOS_RECOMMENDED_COUNT) {
    return pass_check(
      LISTING_CHECK_CODE.PHOTOS_COUNT,
      weight,
      "Buenas fotos",
      `Tu anuncio tiene ${count} fotos.`,
      meta,
    );
  }

  const benchmark =
    segment_median !== null && segment_median > count
      ? `Los anuncios similares tienen ${segment_median} fotos; tú tienes ${count}.`
      : `Los anuncios con ${PHOTOS_RECOMMENDED_COUNT} fotos o más reciben más contactos; tú tienes ${count}.`;

  let points: number;
  let severity: CheckSeverity;
  if (count >= 5) {
    points = 20;
    severity = CHECK_SEVERITY.MEDIUM;
  } else if (count >= 3) {
    points = 10;
    severity = CHECK_SEVERITY.HIGH;
  } else {
    points = 0;
    severity = CHECK_SEVERITY.CRITICAL;
  }

  return {
    code: LISTING_CHECK_CODE.PHOTOS_COUNT,
    status: count < 3 ? CHECK_STATUS.FAIL : CHECK_STATUS.WARN,
    severity,
    weight,
    points,
    title: count < 3 ? "Faltan fotos" : "Añade más fotos",
    description: `${benchmark} Incluye exterior, interior, salpicadero y maletero.`,
    cta: { label: "Añadir fotos", target: LISTING_EDIT_TARGET.IMAGES },
    meta,
  };
};

const build_description_check = (input: ListingHealthInput): ListingCheck => {
  const weight = LISTING_HEALTH_WEIGHTS.description_length;
  const length = (input.description ?? "").trim().length;
  const meta = { length };

  if (length >= DESCRIPTION_RECOMMENDED_LENGTH) {
    return pass_check(
      LISTING_CHECK_CODE.DESCRIPTION_LENGTH,
      weight,
      "Descripción completa",
      "Tu descripción da contexto suficiente a los compradores.",
      meta,
    );
  }

  if (length === 0) {
    return {
      code: LISTING_CHECK_CODE.DESCRIPTION_LENGTH,
      status: CHECK_STATUS.FAIL,
      severity: CHECK_SEVERITY.HIGH,
      weight,
      points: 0,
      title: "Añade una descripción",
      description:
        "Cuenta el estado, el mantenimiento y el equipamiento. Los compradores descartan anuncios sin descripción.",
      cta: { label: "Escribir descripción", target: LISTING_EDIT_TARGET.DESCRIPTION },
      meta,
    };
  }

  const is_short = length < DESCRIPTION_MIN_LENGTH;
  return {
    code: LISTING_CHECK_CODE.DESCRIPTION_LENGTH,
    status: CHECK_STATUS.WARN,
    severity: is_short ? CHECK_SEVERITY.MEDIUM : CHECK_SEVERITY.LOW,
    weight,
    points: is_short ? 5 : 12,
    title: "Amplía la descripción",
    description: `Tu descripción tiene ${length} caracteres. Apunta a ${DESCRIPTION_RECOMMENDED_LENGTH} o más: mantenimiento, revisiones, extras y motivo de venta.`,
    cta: { label: "Mejorar descripción", target: LISTING_EDIT_TARGET.DESCRIPTION },
    meta,
  };
};

const format_deviation = (deviation: number | null): string | null => {
  if (deviation === null) {
    return null;
  }
  const abs = Math.round(Math.abs(deviation));
  return abs === 0 ? null : `${abs}%`;
};

const build_price_check = (input: ListingHealthInput): ListingCheck => {
  const weight = LISTING_HEALTH_WEIGHTS.price_position;

  if (input.price <= 0) {
    return {
      code: LISTING_CHECK_CODE.MISSING_PRICE,
      status: CHECK_STATUS.FAIL,
      severity: CHECK_SEVERITY.CRITICAL,
      weight,
      points: 0,
      title: "Indica un precio",
      description: "Sin precio tu anuncio no aparece en las búsquedas por rango de precio.",
      cta: { label: "Añadir precio", target: LISTING_EDIT_TARGET.PRICE },
    };
  }

  const verdict = input.price_verdict;
  const deviation = format_deviation(input.price_deviation_percent);
  const meta = {
    verdict,
    deviation_percent: input.price_deviation_percent,
  };

  switch (verdict) {
    case PRICE_VERDICT.COMPETITIVO: {
      return pass_check(
        LISTING_CHECK_CODE.PRICE_POSITION,
        weight,
        "Precio competitivo",
        "Tu precio está dentro del rango de anuncios similares.",
        meta,
      );
    }
    case PRICE_VERDICT.BAJO: {
      return {
        code: LISTING_CHECK_CODE.PRICE_POSITION,
        status: CHECK_STATUS.WARN,
        severity: CHECK_SEVERITY.LOW,
        weight,
        points: 20,
        title: "Tu precio está por debajo del mercado",
        description: deviation
          ? `Está un ${deviation} bajo la mediana. Podrías pedir algo más sin perder atractivo.`
          : "Podrías pedir algo más sin perder atractivo.",
        cta: { label: "Revisar precio", target: LISTING_EDIT_TARGET.PRICE },
        meta,
      };
    }
    case PRICE_VERDICT.SOSPECHOSAMENTE_BAJO: {
      return {
        code: LISTING_CHECK_CODE.PRICE_POSITION,
        status: CHECK_STATUS.FAIL,
        severity: CHECK_SEVERITY.CRITICAL,
        weight,
        points: 5,
        title: "Tu precio parece demasiado bajo",
        description:
          "Un precio muy por debajo del mercado genera desconfianza en los compradores. Revisa que sea correcto.",
        cta: { label: "Revisar precio", target: LISTING_EDIT_TARGET.PRICE },
        meta,
      };
    }
    case PRICE_VERDICT.ALTO: {
      return {
        code: LISTING_CHECK_CODE.PRICE_POSITION,
        status: CHECK_STATUS.WARN,
        severity: CHECK_SEVERITY.HIGH,
        weight,
        points: 12,
        title: "Tu precio está por encima del mercado",
        description: deviation
          ? `Está un ${deviation} sobre la mediana de anuncios similares. Ajustarlo acelera la venta.`
          : "Ajustarlo acelera la venta.",
        cta: { label: "Ajustar precio", target: LISTING_EDIT_TARGET.PRICE },
        meta,
      };
    }
    case PRICE_VERDICT.MUY_ALTO: {
      return {
        code: LISTING_CHECK_CODE.PRICE_POSITION,
        status: CHECK_STATUS.FAIL,
        severity: CHECK_SEVERITY.CRITICAL,
        weight,
        points: 0,
        title: "Tu precio está muy por encima del mercado",
        description: deviation
          ? `Está un ${deviation} sobre la mediana de anuncios similares. Con este precio recibirás pocos contactos.`
          : "Con este precio recibirás pocos contactos.",
        cta: { label: "Ajustar precio", target: LISTING_EDIT_TARGET.PRICE },
        meta,
      };
    }
    default: {
      return {
        code: LISTING_CHECK_CODE.PRICE_POSITION,
        status: CHECK_STATUS.UNKNOWN,
        severity: null,
        weight,
        points: 0,
        title: "Sin datos de mercado suficientes",
        description:
          "Aún no hay suficientes anuncios similares para comparar tu precio.",
        cta: null,
        meta,
      };
    }
  }
};

const is_mileage_ok = (input: ListingHealthInput): boolean => {
  if (
    input.condition === CONDITION_VEHICLE.NEW ||
    input.condition === CONDITION_VEHICLE["0KM"]
  ) {
    return true;
  }
  return input.mileage > 0;
};

const build_mileage_check = (input: ListingHealthInput): ListingCheck => {
  const weight = LISTING_HEALTH_WEIGHTS.missing_mileage;
  if (is_mileage_ok(input)) {
    return pass_check(
      LISTING_CHECK_CODE.MISSING_MILEAGE,
      weight,
      "Kilometraje indicado",
      "Tu anuncio muestra el kilometraje.",
    );
  }
  return {
    code: LISTING_CHECK_CODE.MISSING_MILEAGE,
    status: CHECK_STATUS.FAIL,
    severity: CHECK_SEVERITY.HIGH,
    weight,
    points: 0,
    title: "Indica el kilometraje",
    description: "Es uno de los primeros datos que miran los compradores de un vehículo usado.",
    cta: { label: "Añadir kilometraje", target: LISTING_EDIT_TARGET.MILEAGE },
  };
};

const build_missing_field_check = (params: {
  code: ListingCheck["code"];
  weight: number;
  present: boolean;
  severity: CheckSeverity;
  pass_title: string;
  title: string;
  description: string;
  cta_label: string;
  target: NonNullable<ListingCheck["cta"]>["target"];
}): ListingCheck => {
  if (params.present) {
    return pass_check(
      params.code,
      params.weight,
      params.pass_title,
      "Dato completado.",
    );
  }
  return {
    code: params.code,
    status: CHECK_STATUS.FAIL,
    severity: params.severity,
    weight: params.weight,
    points: 0,
    title: params.title,
    description: params.description,
    cta: { label: params.cta_label, target: params.target },
  };
};

const build_equipment_check = (input: ListingHealthInput): ListingCheck => {
  const weight = LISTING_HEALTH_WEIGHTS.equipment_count;
  const count = Math.max(0, input.features_count);
  const meta = { features_count: count };
  if (count >= EQUIPMENT_RECOMMENDED_COUNT) {
    return pass_check(
      LISTING_CHECK_CODE.EQUIPMENT_COUNT,
      weight,
      "Equipamiento indicado",
      `Has marcado ${count} extras.`,
      meta,
    );
  }
  return {
    code: LISTING_CHECK_CODE.EQUIPMENT_COUNT,
    status: CHECK_STATUS.WARN,
    severity: CHECK_SEVERITY.LOW,
    weight,
    points: count >= 1 ? 2 : 0,
    title: "Añade el equipamiento",
    description: `Marca al menos ${EQUIPMENT_RECOMMENDED_COUNT} extras (navegador, cámara, climatizador...). Ayudan a aparecer en más filtros.`,
    cta: { label: "Añadir equipamiento", target: LISTING_EDIT_TARGET.EQUIPMENT },
    meta,
  };
};

export const buildListingChecks = (input: ListingHealthInput): ListingCheck[] => [
  build_photos_check(input),
  build_description_check(input),
  build_price_check(input),
  build_mileage_check(input),
  build_missing_field_check({
    code: LISTING_CHECK_CODE.MISSING_COLOR,
    weight: LISTING_HEALTH_WEIGHTS.missing_color,
    present: Boolean(input.color_id),
    severity: CHECK_SEVERITY.MEDIUM,
    pass_title: "Color indicado",
    title: "Indica el color",
    description: "Muchos compradores filtran por color.",
    cta_label: "Añadir color",
    target: LISTING_EDIT_TARGET.COLOR,
  }),
  build_missing_field_check({
    code: LISTING_CHECK_CODE.MISSING_CATEGORY,
    weight: LISTING_HEALTH_WEIGHTS.missing_category,
    present: Boolean(input.category_id),
    severity: CHECK_SEVERITY.MEDIUM,
    pass_title: "Categoría indicada",
    title: "Indica la categoría",
    description: "Sin categoría tu anuncio no aparece al filtrar por tipo de vehículo.",
    cta_label: "Añadir categoría",
    target: LISTING_EDIT_TARGET.CATEGORY,
  }),
  build_missing_field_check({
    code: LISTING_CHECK_CODE.MISSING_DGT_LABEL,
    weight: LISTING_HEALTH_WEIGHTS.missing_dgt_label,
    present: Boolean(input.dgt_label_id),
    severity: CHECK_SEVERITY.LOW,
    pass_title: "Etiqueta DGT indicada",
    title: "Añade la etiqueta DGT",
    description: "Ayuda a quienes buscan por etiqueta ambiental para circular por zonas de bajas emisiones.",
    cta_label: "Añadir etiqueta",
    target: LISTING_EDIT_TARGET.DGT_LABEL,
  }),
  build_equipment_check(input),
];

const is_issue = (check: ListingCheck): boolean =>
  check.status === CHECK_STATUS.WARN || check.status === CHECK_STATUS.FAIL;

/** Checks no aprobados, por severidad (critical → low) y luego puntos perdidos. */
export const sortListingIssues = (checks: ListingCheck[]): ListingCheck[] =>
  checks
    .filter((check) => is_issue(check))
    .map((check, index) => ({ check, index }))
    .sort((a, b) => {
      const severity_a = a.check.severity ? SEVERITY_RANK[a.check.severity] : 99;
      const severity_b = b.check.severity ? SEVERITY_RANK[b.check.severity] : 99;
      if (severity_a !== severity_b) {
        return severity_a - severity_b;
      }
      const lost_a = a.check.weight - a.check.points;
      const lost_b = b.check.weight - b.check.points;
      if (lost_a !== lost_b) {
        return lost_b - lost_a;
      }
      return a.index - b.index;
    })
    .map(({ check }) => check);

/** Score 0..100 normalizado sobre los checks conocidos (excluye `unknown`). */
export const computeListingScore = (checks: ListingCheck[]): number => {
  const known = checks.filter((check) => check.status !== CHECK_STATUS.UNKNOWN);
  const total_weight = known.reduce((sum, check) => sum + check.weight, 0);
  if (total_weight <= 0) {
    return 0;
  }
  const total_points = known.reduce((sum, check) => sum + check.points, 0);
  return Math.round((total_points / total_weight) * 100);
};

export const buildListingHealth = (input: ListingHealthInput): ListingHealth => {
  const checks = buildListingChecks(input);
  const issues = sortListingIssues(checks);
  const score = computeListingScore(checks);

  return {
    score,
    tier: resolveQualityTier(score),
    checks,
    top_issue: issues[0] ?? null,
    issues_count: issues.length,
    actions: issues.slice(0, LISTING_HEALTH_MAX_ACTIONS),
  };
};

export const toOwnerListingHealthSummary = (
  health: ListingHealth,
  price_verdict: PriceVerdict | null,
): OwnerListingHealthSummary => ({
  score: health.score,
  tier: health.tier,
  top_issue: health.top_issue,
  issues_count: health.issues_count,
  price_verdict,
});

export interface FeaturedRecommendationResult {
  recommendation: FeaturedRecommendation;
  reason: string | null;
}

export const resolveFeaturedRecommendation = (params: {
  price_verdict: PriceVerdict | null;
  score: number;
}): FeaturedRecommendationResult => {
  const { price_verdict, score } = params;

  if (
    price_verdict === PRICE_VERDICT.ALTO ||
    price_verdict === PRICE_VERDICT.MUY_ALTO
  ) {
    return {
      recommendation: FEATURED_RECOMMENDATION.FIX_FIRST,
      reason:
        "Ajusta el precio antes de destacar: destacar un anuncio caro rinde poco.",
    };
  }

  if (score < FEATURED_FIX_FIRST_MAX_SCORE) {
    return {
      recommendation: FEATURED_RECOMMENDATION.FIX_FIRST,
      reason:
        "Mejora tu anuncio antes de destacarlo: más fotos y una buena descripción multiplican el efecto.",
    };
  }

  if (
    (price_verdict === PRICE_VERDICT.COMPETITIVO ||
      price_verdict === PRICE_VERDICT.BAJO) &&
    score >= FEATURED_RECOMMENDED_MIN_SCORE
  ) {
    return {
      recommendation: FEATURED_RECOMMENDATION.RECOMMENDED,
      reason:
        "Tu anuncio está listo para destacar: buen precio y buena calidad. Destacarlo multiplica su visibilidad.",
    };
  }

  return { recommendation: FEATURED_RECOMMENDATION.NEUTRAL, reason: null };
};
