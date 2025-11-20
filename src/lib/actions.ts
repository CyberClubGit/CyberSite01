
'use server';

import { revalidatePath } from 'next/cache';

/**
 * Revalidates the cache for a specific path.
 * This function is a Server Action and should be called from client components.
 */
export async function revalidateData(path: string) {
  try {
    revalidatePath(path);
    console.log(`[Action] Revalidated path: ${path}`);
    return { success: true };
  } catch (error) {
    console.error('[Action] Error revalidating path:', error);
    return { success: false, error: 'Failed to revalidate' };
  }
}
