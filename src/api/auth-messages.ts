// Messages of the shop's REST API named by Spec 001 (RF-13 to RF-16, RF-19, RF-25, RF-26), all
// observed on the live API on 2026-10-08.
export const AUTH_API_MESSAGES = {
  LOGIN_SUCCESS: 'Login Successfully',
  INCORRECT_CREDENTIALS: 'Incorrect email or password.',
  PASSWORD_REQUIRED: 'Password is required',
  EMAIL_REQUIRED: 'Email is required',
  NO_TOKEN: 'Access denied. No token provided.',
  SESSION_TIMEOUT: 'Session Timeout',
} as const;
