/**
 * Pusher Client Configuration
 *
 * Browser-side Pusher client for subscribing to real-time events.
 */

import PusherClient from 'pusher-js';

let pusherClient: PusherClient | null = null;

/**
 * Get or create the Pusher client instance
 */
export function getPusherClient(): PusherClient {
  if (pusherClient) {
    return pusherClient;
  }

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) {
    throw new Error(
      'Missing Pusher configuration. Please check your environment variables.'
    );
  }

  pusherClient = new PusherClient(key, {
    cluster,
    enabledTransports: ['ws', 'wss'],
  });

  // Log connection state changes in development
  if (process.env.NODE_ENV === 'development') {
    pusherClient.connection.bind('connected', () => {
      console.log('[Pusher] Connected');
    });

    pusherClient.connection.bind('disconnected', () => {
      console.log('[Pusher] Disconnected');
    });

    pusherClient.connection.bind('error', (error: any) => {
      console.error('[Pusher] Error:', error);
    });
  }

  return pusherClient;
}

/**
 * Subscribe to a match channel
 */
export function subscribeToMatch(matchId: string) {
  const pusher = getPusherClient();
  return pusher.subscribe(`match-${matchId}`);
}

/**
 * Unsubscribe from a match channel
 */
export function unsubscribeFromMatch(matchId: string) {
  const pusher = getPusherClient();
  pusher.unsubscribe(`match-${matchId}`);
}

/**
 * Subscribe to user channel (for challenges, notifications)
 */
export function subscribeToUser(userId: string) {
  const pusher = getPusherClient();
  return pusher.subscribe(`user-${userId}`);
}

/**
 * Unsubscribe from user channel
 */
export function unsubscribeFromUser(userId: string) {
  const pusher = getPusherClient();
  pusher.unsubscribe(`user-${userId}`);
}

/**
 * Disconnect Pusher client
 */
export function disconnectPusher() {
  if (pusherClient) {
    pusherClient.disconnect();
    pusherClient = null;
  }
}