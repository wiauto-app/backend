export interface AssistantFilterCatalogVehicleType {
  id: string;
  slug: string;
  name: string;
  image_url?: string | null;
}

export interface AssistantFilterCatalogColor {
  id: string;
  slug: string;
  name: string;
  hex_code: string;
}

export interface AssistantFilterCatalogFeature {
  id: string;
  slug: string;
  name: string;
}

export interface AssistantFilterCatalogService {
  id: string;
  slug: string;
  name: string;
  description: string;
}

export interface AssistantFilterCatalogCuota {
  id: string;
  slug: string;
  name: string;
  value: number;
}

export interface AssistantFilterCatalogTraction {
  id: string;
  slug: string;
  name: string;
}

export interface AssistantFilterCatalogWarranty {
  id: string;
  slug: string;
  name: string;
  description: string;
}

export interface AssistantFilterCatalogDgtLabel {
  id: string;
  slug: string;
  name: string;
  code: string;
  description: string;
}

export interface AssistantFilterCatalogFuel {
  id: number;
  slug: string;
  name: string;
  can_charge: boolean;
}

export interface AssistantFilterCatalog {
  vehicleTypes: AssistantFilterCatalogVehicleType[];
  colors: AssistantFilterCatalogColor[];
  features: AssistantFilterCatalogFeature[];
  services: AssistantFilterCatalogService[];
  cuotas: AssistantFilterCatalogCuota[];
  tractions: AssistantFilterCatalogTraction[];
  warranties: AssistantFilterCatalogWarranty[];
  dgtLabels: AssistantFilterCatalogDgtLabel[];
  fuels: AssistantFilterCatalogFuel[];
}
