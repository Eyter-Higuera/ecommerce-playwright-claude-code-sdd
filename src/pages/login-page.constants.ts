// Accessible names of the login form of https://rahulshettyacademy.com/client/#/auth/login.
// Verified on the live page (2026-10-07): the visible "Email" and "Password" labels are not linked
// to their inputs, so each input's accessible name comes from its placeholder.
export const LOGIN_FORM = {
  EMAIL_INPUT_NAME: 'email@example.com',
  // The site's placeholder really has the typo "passsword"; it is the accessible name.
  PASSWORD_INPUT_NAME: 'enter your passsword',
  LOGIN_BUTTON_NAME: 'Login',
} as const;
