import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";


export class CategoryNotFoundException extends ValidationException {
  constructor(public readonly id: string) {
    super(`Categoría con id ${id} no encontrada`);
  }
}