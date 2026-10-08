import { z } from 'zod';
import { AUTH_API_MESSAGES } from '../auth-messages';

// Contracts of the login endpoint for Spec 001. RF-13: a successful login answers JSON with a
// non-empty string `token`, a non-empty string `userId` and the success message. Other fields are
// allowed and ignored.
export const authLoginSuccessSchema = z.object({
  token: z.string().min(1),
  userId: z.string().min(1),
  message: z.literal(AUTH_API_MESSAGES.LOGIN_SUCCESS),
});

export type AuthLoginSuccess = z.infer<typeof authLoginSuccessSchema>;

/** Error bodies (RF-14 to RF-16, RF-19, RF-25, RF-26): at least a string `message`. */
export const apiMessageSchema = z.object({
  message: z.string(),
});
