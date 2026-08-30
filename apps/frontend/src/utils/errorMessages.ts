import { AlertCircle, Ban, ShieldAlert, Mail, KeyRound, ShieldCheck } from 'lucide-react';

export interface MappedErrorMessage {
  message: string;
  tone: 'error' | 'warning' | 'info';
  icon: any;
}

export const ERROR_CODE_MAPPINGS: Record<string, MappedErrorMessage> = {
  ACCOUNT_SUSPENDED: {
    message: 'This account has been suspended. Please contact support.',
    tone: 'error',
    icon: Ban,
  },
  ACCOUNT_DELETED: {
    message: 'This account has been deleted.',
    tone: 'error',
    icon: ShieldAlert,
  },
  INVALID_CREDENTIALS: {
    message: 'Incorrect email or password. Please try again.',
    tone: 'error',
    icon: KeyRound,
  },
  EMAIL_NOT_VERIFIED: {
    message: 'Your email address is not verified. Please verify it to log in.',
    tone: 'warning',
    icon: Mail,
  },
  RATE_LIMITED: {
    message: 'Too many requests. Please wait a moment before trying again.',
    tone: 'warning',
    icon: AlertCircle,
  },
  VALIDATION_ERROR: {
    message: 'Validation failed. Please check the entered data.',
    tone: 'error',
    icon: AlertCircle,
  },
  EMAIL_ALREADY_VERIFIED: {
    message: 'Your email is already verified. Please proceed to login.',
    tone: 'info',
    icon: ShieldCheck,
  },
  INVALID_VERIFICATION_CODE: {
    message: 'The verification code entered is invalid. Please double check.',
    tone: 'error',
    icon: AlertCircle,
  },
  VERIFICATION_CODE_EXPIRED: {
    message: 'The verification code has expired. Please request a new one.',
    tone: 'warning',
    icon: AlertCircle,
  },
  INCORRECT_PASSWORD: {
    message: 'The current password you entered is incorrect.',
    tone: 'error',
    icon: KeyRound,
  },
  INVALID_REFRESH_TOKEN: {
    message: 'Your session has expired. Please sign in again.',
    tone: 'error',
    icon: ShieldAlert,
  },
  CONFLICT: {
    message: 'An account with this email already exists.',
    tone: 'error',
    icon: AlertCircle,
  },
  INVALID_STAFF_ROLE: {
    message: 'Invalid staff role provided.',
    tone: 'error',
    icon: ShieldAlert,
  },
};

export const getMappedError = (errorCode?: string): MappedErrorMessage => {
  return (
    ERROR_CODE_MAPPINGS[errorCode || ''] || {
      message: 'Something went wrong, please try again.',
      tone: 'error',
      icon: AlertCircle,
    }
  );
};
