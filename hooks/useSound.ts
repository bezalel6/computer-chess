/**
 * Sound Hook
 *
 * React hook for playing game sounds with convenience methods.
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { getSoundManager, type SoundType } from '@/lib/sounds/manager';

export function useSound() {
  const soundManager = useRef(getSoundManager());

  const play = useCallback((type: SoundType) => {
    soundManager.current.play(type);
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    soundManager.current.setEnabled(enabled);
  }, []);

  const isEnabled = useCallback(() => {
    return soundManager.current.isEnabled();
  }, []);

  const setVolume = useCallback((type: SoundType, volume: number) => {
    soundManager.current.setVolume(type, volume);
  }, []);

  const setGlobalVolume = useCallback((volume: number) => {
    soundManager.current.setGlobalVolume(volume);
  }, []);

  return {
    play,
    setEnabled,
    isEnabled,
    setVolume,
    setGlobalVolume,
  };
}