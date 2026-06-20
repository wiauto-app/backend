export const PLAN_AUDIENCE = {
  PARTICULAR: "particular",
  PROFESSIONAL: "professional",
  BUYER: "buyer",
} as const;

export type PlanAudience = (typeof PLAN_AUDIENCE)[keyof typeof PLAN_AUDIENCE];

export const BILLING_TYPE = {
  RECURRING: "recurring",
  ONE_TIME: "one_time",
} as const;

export type BillingType = (typeof BILLING_TYPE)[keyof typeof BILLING_TYPE];

export const PRICE_INTERVAL = {
  MONTH: "month",
  YEAR: "year",
  ONE_TIME: "one_time",
} as const;

export type PriceInterval = (typeof PRICE_INTERVAL)[keyof typeof PRICE_INTERVAL];

export const SUBSCRIPTION_STATUS = {
  ACTIVE: "active",
  CANCELED: "canceled",
  PAST_DUE: "past_due",
  INCOMPLETE: "incomplete",
  TRIALING: "trialing",
  UNPAID: "unpaid",
  INCOMPLETE_EXPIRED: "incomplete_expired",
} as const;

export type SubscriptionStatus =
  (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];

export const ONE_TIME_PURCHASE_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded",
} as const;

export type OneTimePurchaseStatus =
  (typeof ONE_TIME_PURCHASE_STATUS)[keyof typeof ONE_TIME_PURCHASE_STATUS];

export const BILLING_INVOICE_STATUS = {
  DRAFT: "draft",
  OPEN: "open",
  PAID: "paid",
  VOID: "void",
  UNCOLLECTIBLE: "uncollectible",
} as const;

export type BillingInvoiceStatus =
  (typeof BILLING_INVOICE_STATUS)[keyof typeof BILLING_INVOICE_STATUS];
