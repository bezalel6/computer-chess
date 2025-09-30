/**
 * Pusher Server Configuration
 *
 * Server-side Pusher client for triggering real-time events.
 */

import Pusher from 'pusher';

let pusherServer: Pusher | null = null;

/**
 * Get or create the Pusher server instance
 */
export function getPusherServer(): Pusher {
  if (pusherServer) {
    return pusherServer;
  }

  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER;

  if (!appId || !key || !secret || !cluster) {
    throw new Error(
      'Missing Pusher configuration. Please check your environment variables.'
    );
  }

  pusherServer = new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  });

  return pusherServer;
}

/**
 * Trigger a move event to notify opponent
 */
export async function triggerMove(
  matchId: string,
  move: { from: string; to: string; promotion?: string },
  newFen: string
): Promise<void> {
  const pusher = getPusherServer();

  await pusher.trigger(`match-${matchId}`, 'opponent:move', {
    move,
    fen: newFen,
    timestamp: Date.now(),
  });
}

/**
 * Trigger a score update event
 */
export async function triggerScoreUpdate(
  matchId: string,
  userId: string,
  points: number
): Promise<void> {
  const pusher = getPusherServer();

  await pusher.trigger(`match-${matchId}`, 'opponent:score', {
    userId,
    points,
    timestamp: Date.now(),
  });
}

/**
 * Trigger match start event
 */
export async function triggerMatchStart(
  matchId: string,
  match: {
    id: string;
    white: string;
    black: string;
    whitePlayerId: string;
    blackPlayerId: string;
    fen: string;
  }
): Promise<void> {
  const pusher = getPusherServer();

  await pusher.trigger(`match-${matchId}`, 'match:start', {
    match,
    timestamp: Date.now(),
  });
}

/**
 * Trigger match end event
 */
export async function triggerMatchEnd(
  matchId: string,
  result: {
    winner: 'white' | 'black' | 'draw';
    reason: string;
  }
): Promise<void> {
  const pusher = getPusherServer();

  await pusher.trigger(`match-${matchId}`, 'match:end', {
    result,
    timestamp: Date.now(),
  });
}

/**
 * Trigger challenge event
 */
export async function triggerChallenge(
  userId: string,
  challenge: {
    id: string;
    challengerName: string;
    challengerId: string;
  }
): Promise<void> {
  const pusher = getPusherServer();

  await pusher.trigger(`user-${userId}`, 'challenge:received', {
    challenge,
    timestamp: Date.now(),
  });
}