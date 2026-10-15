export const REFERRAL_STATUS = {
  ATTRIBUTED: "attributed",
  REWARDED: "rewarded",
} as const;

export type ReferralStatus =
  (typeof REFERRAL_STATUS)[keyof typeof REFERRAL_STATUS];

export const REFERRAL_REWARD_DURATION_DAYS = 7;
export const REFERRAL_REWARD_BOOST_WEIGHT = 50;
