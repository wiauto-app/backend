export const PLAN_AUDIENCE = {
  PARTICULAR: "particular",
  DEALERSHIP: "dealership",
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

export const ONE_TIME_PRODUCT_KIND = {
  ASSISTANT_CREDIT_PACK: "assistant_credit_pack",
  FEATURED_LISTING_OFFER: "featured_listing_offer",
} as const;

export type OneTimeProductKind =
  (typeof ONE_TIME_PRODUCT_KIND)[keyof typeof ONE_TIME_PRODUCT_KIND];

export const BILLING_INVOICE_STATUS = {
  DRAFT: "draft",
  OPEN: "open",
  PAID: "paid",
  VOID: "void",
  UNCOLLECTIBLE: "uncollectible",
} as const;

export type BillingInvoiceStatus =
  (typeof BILLING_INVOICE_STATUS)[keyof typeof BILLING_INVOICE_STATUS];

export const PLAN_TYPE = {
  STANDARD: "standard",
  CUSTOM: "custom",
} as const;

export type PlanType = (typeof PLAN_TYPE)[keyof typeof PLAN_TYPE];

export const PLAN_VERSION_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
} as const;

export type PlanVersionStatus =
  (typeof PLAN_VERSION_STATUS)[keyof typeof PLAN_VERSION_STATUS];

export const PLAN_LEAD_STATUS = {
  PENDING: "pending",
  CONTACTED: "contacted",
  PROPOSAL_SENT: "proposal_sent",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
} as const;

export type PlanLeadStatus =
  (typeof PLAN_LEAD_STATUS)[keyof typeof PLAN_LEAD_STATUS];

export const PROFESSIONAL_ACCOUNT_TYPE = {
  SELF_EMPLOYED: "self_employed",
  COMPANY: "company",
} as const;

export type ProfessionalAccountType =
  (typeof PROFESSIONAL_ACCOUNT_TYPE)[keyof typeof PROFESSIONAL_ACCOUNT_TYPE];
