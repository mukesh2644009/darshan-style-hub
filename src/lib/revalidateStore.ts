import { revalidatePath } from 'next/cache';

/**
 * After an admin changes products (prices, photos, ratings, new or deleted
 * products), refresh the cached storefront pages straight away instead of
 * waiting for the home page's 5-minute cache (`revalidate = 300`) to expire.
 */
export function revalidateStorefront(): void {
  try {
    revalidatePath('/');
    revalidatePath('/products');
    revalidatePath('/products/[id]', 'page');
  } catch (err) {
    // Never fail the save because of a cache refresh.
    console.warn('Storefront revalidate failed:', err instanceof Error ? err.message : err);
  }
}
