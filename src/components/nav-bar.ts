import type { Locator, Page } from '@playwright/test';

// Header of a logged-in customer (Spec 001, RF-3, RF-9, RF-21, RF-22): locators and actions only,
// no assertions. Verified on the live site (2026-10-08): the header buttons are HOME, ORDERS, Cart
// and Sign Out.

export const NAV_BAR = {
  SIGN_OUT_NAME: 'Sign Out',
  // The Cart button's name starts with an icon-font glyph (" Cart", verified 2026-10-08) and may
  // carry an item counter after the label, while every product card has an " Add To Cart"
  // button, so "Cart" must be the first word after any non-word characters.
  CART_NAME: /^\W*Cart\b/,
} as const;

export class NavBar {
  readonly signOutButton: Locator;
  readonly cartButton: Locator;

  constructor(readonly page: Page) {
    this.signOutButton = page.getByRole('button', { name: NAV_BAR.SIGN_OUT_NAME, exact: true });
    this.cartButton = page.getByRole('button', { name: NAV_BAR.CART_NAME });
  }

  async signOut(): Promise<void> {
    await this.signOutButton.click();
  }

  /** Goes to the cart, a second protected route (TC-001-30). */
  async openCart(): Promise<void> {
    await this.cartButton.click();
  }
}
