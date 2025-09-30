/**
 * Sound Manager
 *
 * Manages game sound effects with preloading and volume control.
 */

export type SoundType =
  | 'start'
  | 'gameOver'
  | 'move'
  | 'capture'
  | 'fail'
  | 'check'
  | 'castle'
  | 'promote';

class SoundManager {
  private sounds: Map<SoundType, HTMLAudioElement>;
  private enabled: boolean = true;

  constructor() {
    this.sounds = new Map();
    this.initializeSounds();
  }

  private initializeSounds() {
    const soundFiles: Record<SoundType, string> = {
      start: '/sounds/game-start.wav',
      gameOver: '/sounds/game-end.wav',
      move: '/sounds/self-move.wav',
      capture: '/sounds/capture.wav',
      fail: '/sounds/fail.wav',
      check: '/sounds/check.wav',
      castle: '/sounds/castle.wav',
      promote: '/sounds/promote.wav',
    };

    Object.entries(soundFiles).forEach(([type, path]) => {
      const audio = new Audio(path);
      audio.preload = 'auto';

      // Set custom volumes for specific sounds
      if (type === 'fail') {
        audio.volume = 0.7;
      }

      this.sounds.set(type as SoundType, audio);
    });
  }

  play(type: SoundType): void {
    if (!this.enabled) return;

    const sound = this.sounds.get(type);
    if (sound) {
      // Clone and play to allow overlapping sounds
      const clone = sound.cloneNode() as HTMLAudioElement;
      clone.volume = sound.volume;
      clone.play().catch((error) => {
        console.warn(`Failed to play sound: ${type}`, error);
      });
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setVolume(type: SoundType, volume: number): void {
    const sound = this.sounds.get(type);
    if (sound) {
      sound.volume = Math.max(0, Math.min(1, volume));
    }
  }

  setGlobalVolume(volume: number): void {
    const normalizedVolume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach((sound) => {
      sound.volume = normalizedVolume;
    });
  }
}

// Singleton instance
let soundManagerInstance: SoundManager | null = null;

export function getSoundManager(): SoundManager {
  if (typeof window === 'undefined') {
    // Return a no-op manager for SSR
    return {
      play: () => {},
      setEnabled: () => {},
      isEnabled: () => false,
      setVolume: () => {},
      setGlobalVolume: () => {},
    } as SoundManager;
  }

  if (!soundManagerInstance) {
    soundManagerInstance = new SoundManager();
  }

  return soundManagerInstance;
}

export default SoundManager;