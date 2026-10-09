import { z } from 'zod';
import { PRODUCT_API_MESSAGES } from '../product-messages';

// Contracts of the product API for Spec 002. Other fields of a product (image, rating, description,
// ...) are allowed and ignored.

/**
 * One catalog product (Spec 002 RF-17): the fields the spec names. `productDescription` is optional
 * here, so Spec 002 contracts stay as they are, and kept so Spec 003 can compare it (plan D-2).
 */
export const productSchema = z.object({
  _id: z.string().min(1),
  productName: z.string().min(1),
  productCategory: z.string().min(1),
  productSubCategory: z.string().min(1),
  productFor: z.string().min(1),
  productPrice: z.number(),
  productDescription: z.string().optional(),
});

export type Product = z.infer<typeof productSchema>;

/** RF-17: success message, a non-empty `data` array and `count` equal to its length. */
export const productListSchema = z
  .object({
    message: z.literal(PRODUCT_API_MESSAGES.ALL_FETCHED),
    data: z.array(productSchema).min(1),
    count: z.number(),
  })
  .refine((body) => body.count === body.data.length, { message: 'count must equal the length of data', path: ['count'] });

/** RF-19: no product matches; `data` is empty and the message says so. */
export const noProductsSchema = z.object({
  message: z.literal(PRODUCT_API_MESSAGES.NO_PRODUCTS),
  data: z.array(z.unknown()).length(0),
});

/** Any answer that carries a product list, empty or not (RF-18): used to read the matched products. */
export const productAnswerSchema = z.object({
  data: z.array(productSchema),
});

/** Spec 003 RF-11: the detail of one product, with a non-empty description. */
export const productDetailSchema = z.object({
  message: z.literal(PRODUCT_API_MESSAGES.DETAIL_FETCHED),
  data: productSchema.extend({ productDescription: z.string().min(1) }),
});
