export class PlanNotFoundException extends Error {
  constructor(id: string) {
    super(`Plan de suscripción no encontrado: ${id}`);
    this.name = "PlanNotFoundException";
  }
}

export class PlanPriceNotFoundException extends Error {
  constructor(id: string) {
    super(`Precio de plan no encontrado: ${id}`);
    this.name = "PlanPriceNotFoundException";
  }
}

export class BillingProfileNotFoundException extends Error {
  constructor(id: string) {
    super(`Perfil no encontrado: ${id}`);
    this.name = "BillingProfileNotFoundException";
  }
}

export class StripeCheckoutException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StripeCheckoutException";
  }
}
