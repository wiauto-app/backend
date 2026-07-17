import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from "class-validator";

import { is_temp_storage_path } from "../types/temp-storage-path";

export const IsTempStoragePath = (validation_options?: ValidationOptions) => {
  return (object: object, property_name: string) => {
    registerDecorator({
      name: "isTempStoragePath",
      target: object.constructor,
      propertyName: property_name,
      options: validation_options,
      validator: {
        validate(value: unknown, _args: ValidationArguments) {
          return typeof value === "string" && is_temp_storage_path(value);
        },
        defaultMessage() {
          return 'La ruta debe estar en almacenamiento temporal (incluir el segmento "temp").';
        },
      },
    });
  };
};
