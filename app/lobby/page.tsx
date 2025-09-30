/**
 * Lobby Page
 *
 * Redirects to the play page.
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';

export default async function LobbyPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Redirect to play page
  redirect('/play');
}