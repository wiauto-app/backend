import { SetMetadata } from "@nestjs/common";

export const REQUIRE_SUBSCRIPTION_KEY = "require_subscription";

/** Marca la ruta para que SubscriptionGuard exija suscripción activa (o admin). */
export const RequireSubscription = (): MethodDecorator & ClassDecorator =>
  SetMetadata(REQUIRE_SUBSCRIPTION_KEY, true);
