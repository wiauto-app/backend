import { applyDecorators } from "@nestjs/common";
import { Transform } from "class-transformer";
import {
  IsOptional,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
} from "class-validator";

export function normalize_query_string_array(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value.map(String);
  }
  if (typeof value === "string") {
    return [value];
  }
  return undefined;
}

export function normalize_optional_number(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const n = Number(value);
  return Number.isNaN(n) ? (value as number) : n;
}

export function normalize_optional_boolean(value: unknown): unknown {
  if (value === undefined || value === null || value === "") {
    return;
  }
  if (value === true || value === false) {
    return value;
  }
  if (value === "true" || value === "1") {
    return true;
  }
  if (value === "false" || value === "0") {
    return false;
  }
  return value;
}

@ValidatorConstraint({ name: "is_string_array", async: false })
class IsStringArrayConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    void args;
    if (!Array.isArray(value)) {
      return false;
    }
    return value.every((item) => typeof item === "string");
  }

  defaultMessage(): string {
    return "debe ser un array de strings";
  }
}

export function IsStringArray(validation_options?: ValidationOptions): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol) {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyKey as string,
      options: validation_options,
      constraints: [],
      validator: IsStringArrayConstraint,
    });
  };
}

/**
 * Query opcional: ausente, un valor o repetición de clave → siempre `string[]` o `undefined`.
 * Usar junto con validación; `IsOptional` omite el resto si queda `undefined`.
 */
export function OptionalQueryStringArray() {
  return applyDecorators(
    IsOptional(),
    Transform(({ value }) => normalize_query_string_array(value)),
    IsStringArray(),
  );
}

@ValidatorConstraint({ name: "is_positive_integer", async: false })
class IsPositiveIntegerConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    void args;
    return typeof value === "number" && Number.isInteger(value) && value > 0;
  }

  defaultMessage(): string {
    return "debe ser un entero mayor que 0";
  }
}

export function IsPositiveInteger(validation_options?: ValidationOptions): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol) {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyKey as string,
      options: validation_options,
      constraints: [],
      validator: IsPositiveIntegerConstraint,
    });
  };
}

/**
 * Entero > 0 opcional (query / body): cadenas vacías → `undefined`.
 */
export function OptionalPositiveInt() {
  return applyDecorators(
    IsOptional(),
    Transform(({ value }) => normalize_optional_number(value)),
    IsPositiveInteger(),
  );
}
