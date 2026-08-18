"use client";
import { createContext, useContext, useRef, useState, useCallback, ReactNode } from "react";

export interface RadioTrack {
  id: string;
  title: string;
  artist?: string;
  duration?: number;
  url: string;
  isLive?: boolean;
  thumbnailUrl?: string;
}

interface RadioPlayerState {
  currentTrack: RadioTrack | null;
  isPlaying: boolean;
  isLive: boolean;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  streamStatus: "idle" | "loading" | "playing" | "error" | "offline";
}

interface RadioPlayerContextType {
  state: RadioPlayerState;
  play: (track: RadioTrack) => void;
  pause: () => void;
  toggle: () => void;
  setVolume: (v: number) => void;
  mute: () => void;
  unmute: () => void;
  seek: (time: number) => void;
}

const RadioPlayerContext = createContext<RadioPlayerContextType | null>(null);

export function RadioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<RadioPlayerState>({
    currentTrack: null,
    isPlaying: false,
    isLive: false,
    volume: 1,
    isMuted: false,
    currentTime: 0,
    duration: 0,
    streamStatus: "idle",
  });

  const play = useCallback((track: RadioTrack) => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = state.volume;
    }
    audioRef.current.src = track.url;
    audioRef.current.play();
    setState(prev => ({
      ...prev,
      currentTrack: track,
      isPlaying: true,
      isLive: track.isLive ?? false,
      streamStatus: "playing",
    }));
  }, [state.volume]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const toggle = useCallback(() => {
    if (!state.currentTrack) return;
    if (state.isPlaying) pause();
    else { audioRef.current?.play(); setState(prev => ({ ...prev, isPlaying: true })); }
  }, [state.isPlaying, state.currentTrack, pause]);

  const setVolume = useCallback((v: number) => {
    if (audioRef.current) audioRef.current.volume = v;
    setState(prev => ({ ...prev, volume: v, isMuted: v === 0 }));
  }, []);

  const mute = useCallback(() => {
    if (audioRef.current) audioRef.current.muted = true;
    setState(prev => ({ ...prev, isMuted: true }));
  }, []);

  const unmute = useCallback(() => {
    if (audioRef.current) audioRef.current.muted = false;
    setState(prev => ({ ...prev, isMuted: false }));
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) audioRef.current.currentTime = time;
    setState(prev => ({ ...prev, currentTime: time }));
  }, []);

  return (
    <RadioPlayerContext.Provider value={{ state, play, pause, toggle, setVolume, mute, unmute, seek }}>
      {children}
      {state.currentTrack && <miniPlayer />}
    </RadioPlayerContext.Provider>
  );
}

export function useRadioPlayer() {
  const ctx = useContext(RadioPlayerContext);
  if (!ctx) throw new Error("useRadioPlayer must be used within RadioPlayerProvider");
  return ctx;
}

function miniPlayer() {
  // This will be replaced by the actual MiniPlayer component
  return null;
}
