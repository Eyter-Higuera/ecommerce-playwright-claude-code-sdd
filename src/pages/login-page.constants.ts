// Accessible names of the login form of https://rahulshettyacademy.com/client/#/auth/login.
// Verified on the live page (2026-10-07): the visible "Email" and "Password" labels are not linked
// to their inputs, so each input's accessible name comes from its placeholder.
export const LOGIN_FORM = {
  EMAIL_INPUT_NAME: 'email@example.com',
  // The site's placeholder really has the typo "passsword"; it is the accessible name.
  PASSWORD_INPUT_NAME: 'enter your passsword',
  LOGIN_BUTTON_NAME: 'Login',
} as const;

// Messages of the login form named by Spec 001 (RF-4 to RF-7). The wrong-credentials toast is an
// element with role `alert` whose accessible name is its text (verified live on 2026-10-08).
export const LOGIN_MESSAGES = {
  EMAIL_REQUIRED: '*Email is required',
  PASSWORD_REQUIRED: '*Password is required',
  VALID_EMAIL: '*Enter Valid Email',
  INCORRECT_CREDENTIALS: 'Incorrect email or password.',
} as const;
