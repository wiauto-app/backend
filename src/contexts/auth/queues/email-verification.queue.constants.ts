export const EMAIL_VERIFICATION_QUEUE = "email-verification";

export const EMAIL_VERIFICATION_JOB_SEND = "send";

export interface EmailVerificationJobData {
  userId: string;
  email: string;
}
