import { z } from 'zod';
import { CART_API_MESSAGES } from '../cart-messages';
import { productSchema } from './product.schema';

// Contracts of the cart API for Spec 004. Products in a cart carry the product fields of Spec 002.

/** RF-17: a non-empty cart: its products and a `count` equal to their number. */
export const cartListSchema = z
  .object({
    message: z.literal(CART_API_MESSAGES.FOUND),
    products: z.array(productSchema).min(1),
    count: z.number(),
  })
  .refine((body) => body.count === body.products.length, { message: 'count must equal the number of products', path: ['count'] });

/** RF-17: the count of a non-empty cart. */
export const cartCountSchema = z.object({
  message: z.literal(CART_API_MESSAGES.FOUND),
  count: z.number().int().positive(),
});

/** RF-18: an empty cart (list or count): the message and no product (the observed answer has no `count`). */
export const emptyCartSchema = z.object({
  message: z.literal(CART_API_MESSAGES.EMPTY),
  products: z.array(z.unknown()).length(0).optional(),
});
