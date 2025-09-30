/**
 * Realtime Provider
 *
 * Manages Pusher subscriptions and real-time event handling for matches.
 */

'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useGameStore } from '@/stores/gameStore';
import {
  getPusherClient,
  subscribeToMatch,
  unsubscribeFromMatch,
  disconnectPusher,
} from '@/lib/realtime/pusher-client';
import type { Channel } from 'pusher-js';

interface RealtimeProviderProps {
  matchId: string | null;
  children: React.ReactNode;
}

export function RealtimeProvider({ matchId, children }: RealtimeProviderProps) {
  const { data: session } = useSession();
  const channelRef = useRef<Channel | null>(null);
  const currentMatchIdRef = useRef<string | null>(null);

  const { makeMove, updateOpponentScore, resetGame } = useGameStore();

  useEffect(() => {
    // Don't initialize if no match or not authenticated
    if (!matchId || !session?.user?.id) {
      return;
    }

    // Don't re-subscribe if already subscribed to the same match
    if (currentMatchIdRef.current === matchId) {
      return;
    }

    // Unsubscribe from previous match if exists
    if (currentMatchIdRef.current) {
      unsubscribeFromMatch(currentMatchIdRef.current);
    }

    console.log(`[Realtime] Subscribing to match-${matchId}`);

    try {
      // Get Pusher client (will throw if env vars missing)
      getPusherClient();

      // Subscribe to match channel
      const channel = subscribeToMatch(matchId);
      channelRef.current = channel;
      currentMatchIdRef.current = matchId;

      // Handle opponent moves
      channel.bind('opponent:move', (data: {
        move: { from: string; to: string; promotion?: string };
        fen: string;
        timestamp: number;
      }) => {
        console.log('[Realtime] Received opponent move:', data);

        // Update game state with opponent's move
        const success = makeMove(data.move);

        if (success) {
          console.log('[Realtime] Applied opponent move successfully');
        } else {
          console.error('[Realtime] Failed to apply opponent move');
        }
      });

      // Handle opponent score updates
      channel.bind('opponent:score', (data: {
        userId: string;
        points: number;
        timestamp: number;
      }) => {
        console.log('[Realtime] Received score update:', data);

        // Only update if it's the opponent's score
        if (data.userId !== session.user?.id) {
          updateOpponentScore(data.points);
        }
      });

      // Handle match start
      channel.bind('match:start', (data: {
        match: {
          id: string;
          white: string;
          black: string;
          whitePlayerId: string;
          blackPlayerId: string;
          fen: string;
        };
        timestamp: number;
      }) => {
        console.log('[Realtime] Match started:', data);
      });

      // Handle match end
      channel.bind('match:end', (data: {
        result: {
          winner: 'white' | 'black' | 'draw';
          reason: string;
        };
        timestamp: number;
      }) => {
        console.log('[Realtime] Match ended:', data);
        // Game end is handled by the chess logic, but we could show a notification here
      });

      // Handle subscription success
      channel.bind('pusher:subscription_succeeded', () => {
        console.log('[Realtime] Successfully subscribed to match channel');
      });

      // Handle subscription error
      channel.bind('pusher:subscription_error', (error: any) => {
        console.error('[Realtime] Subscription error:', error);
      });

    } catch (error) {
      console.error('[Realtime] Failed to initialize:', error);
    }

    // Cleanup on unmount or match change
    return () => {
      if (channelRef.current && currentMatchIdRef.current) {
        console.log(`[Realtime] Unsubscribing from match-${currentMatchIdRef.current}`);

        // Unbind all events
        channelRef.current.unbind_all();

        // Unsubscribe from channel
        unsubscribeFromMatch(currentMatchIdRef.current);

        channelRef.current = null;
        currentMatchIdRef.current = null;
      }
    };
  }, [matchId, session?.user?.id, makeMove, updateOpponentScore, resetGame]);

  // Disconnect Pusher on unmount
  useEffect(() => {
    return () => {
      disconnectPusher();
    };
  }, []);

  return <>{children}</>;
}