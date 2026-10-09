import { z } from 'zod';

// Contract of a successful `POST {API_BASE_URL}/auth/login` (Spec 000, RF-54 / RF-56): the body is
// JSON with a non-empty string `token`. Other fields are allowed and ignored.
export const loginResponseSchema = z.object({
  token: z.string().min(1),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;
