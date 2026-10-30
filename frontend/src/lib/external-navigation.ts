/** Leave the app for another site (Stripe Checkout). A module so tests can mock it. */
export function goToExternal(url: string): void {
  window.location.assign(url);
}
