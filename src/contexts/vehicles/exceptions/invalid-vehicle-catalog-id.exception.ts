import { BadRequestException } from "@nestjs/common";

const CATALOG_FIELD_LABELS: Record<string, string> = {
  vehicle_type_id: "El tipo de vehículo",
  category_id: "La categoría",
  color_id: "El color",
  dgt_label_id: "La etiqueta DGT",
  warranty_type_id: "El tipo de garantía",
  traction_id: "La tracción",
  cuota_ids: "Alguna de las cuotas",
};

const DEFAULT_CATALOG_FIELD_LABEL = "El valor seleccionado";

export class InvalidVehicleCatalogIdException extends BadRequestException {
  constructor(
    public readonly field: string,
    public readonly id: string,
  ) {
    const label = CATALOG_FIELD_LABELS[field] ?? DEFAULT_CATALOG_FIELD_LABEL;
    super(
      `${label} no corresponde a ninguna opción disponible. Revisa la selección.`,
    );
    this.name = "InvalidVehicleCatalogIdException";
  }
}
