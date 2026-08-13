export enum LoginFailureReason {
  INVALID_CREDENTIALS = 'invalid_credentials',
  ACCOUNT_INACTIVE = 'account_inactive',
  EMAIL_NOT_VERIFIED = 'email_not_verified',
  TOO_MANY_ATTEMPTS = 'too_many_attempts',
  UNKNOWN = 'unknown',
}
