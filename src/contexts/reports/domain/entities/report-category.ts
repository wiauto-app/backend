import { slugify } from "@/src/contexts/shared/slugify-string/slugify";
import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";

export enum ReportTargetType {
  PROFILE = "profile",
  DEALERSHIP = "dealership",
  VEHICLE = "vehicle",
}

export interface PrimitiveReportCategory {
  id: string;
  name: string;
  slug: string;
  target_type: ReportTargetType;
  created_at: Date;
  updated_at: Date;
}

export class ReportCategory {
  constructor(private readonly primitive_report_category: PrimitiveReportCategory) {}

  static create(payload: {
    name: string;
    target_type: ReportTargetType;
  }): ReportCategory {
    return new ReportCategory({
      id: uuidv4(),
      name: payload.name,
      slug: slugify(payload.name),
      target_type: payload.target_type,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  update(update_report_category: {
    name?: string;
    target_type?: ReportTargetType;
  }): ReportCategory {
    const previous = this.primitive_report_category;
    const next_name = update_report_category.name ?? previous.name;
    const name_changed =
      update_report_category.name !== undefined &&
      update_report_category.name !== previous.name;

    return new ReportCategory({
      ...previous,
      name: next_name,
      slug: name_changed ? slugify(next_name) : previous.slug,
      target_type: update_report_category.target_type ?? previous.target_type,
      updated_at: new Date(),
    });
  }

  static fromPrimitives(primitive: PrimitiveReportCategory): ReportCategory {
    return new ReportCategory(primitive);
  }

  toPrimitives(): PrimitiveReportCategory {
    return {
      ...this.primitive_report_category,
    };
  }
}
