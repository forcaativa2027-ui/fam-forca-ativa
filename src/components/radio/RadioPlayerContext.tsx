"use client";
import { createContext, useContext, useState, useRef, useCallback, type ReactNode } from "react";

interface RadioPlayerState {
  isPlaying: boolean;
  isLive: boolean;
  currentTitle: string | null;
  currentCover: string | null;
  streamUrl: string | null;
  volume: number;
  currentTime: number;
  duration: number;
}

interface RadioPlayerCtx extends RadioPlayerState {
  playStream: (url: string, title?: string, cover?: string) => void;
  playEpisode: (url: string, title?: string, cover?: string) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  setVolume: (v: number) => void;
  seek: (time: number) => void;
  stop: () => void;
}

const Ctx = createContext<RadioPlayerCtx | null>(null);

export function RadioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<RadioPlayerState>({
    isPlaying: false, isLive: false, currentTitle: null, currentCover: null,
    streamUrl: null, volume: 1, currentTime: 0, duration: 0,
  });

  const getAudio = useCallback(() => {
    if (!audioRef.current) audioRef.current = new Audio();
    return audioRef.current;
  }, []);

  const playStream = useCallback((url: string, title?: string, cover?: string) => {
    const a = getAudio();
    a.src = url;
    a.play();
    setState(s => ({ ...s, isPlaying: true, isLive: true, currentTitle: title ?? null, currentCover: cover ?? null, streamUrl: url }));
  }, [getAudio]);

  const playEpisode = useCallback((url: string, title?: string, cover?: string) => {
    const a = getAudio();
    a.src = url;
    a.play();
    setState(s => ({ ...s, isPlaying: true, isLive: false, currentTitle: title ?? null, currentCover: cover ?? null, streamUrl: url }));
  }, [getAudio]);

  const pause = useCallback(() => { getAudio().pause(); setState(s => ({ ...s, isPlaying: false })); }, [getAudio]);
  const resume = useCallback(() => { getAudio().play(); setState(s => ({ ...s, isPlaying: true })); }, [getAudio]);
  const togglePlay = useCallback(() => { state.isPlaying ? pause() : resume(); }, [state.isPlaying, pause, resume]);
  const setVolume = useCallback((v: number) => { getAudio().volume = v; setState(s => ({ ...s, volume: v })); }, [getAudio]);
  const seek = useCallback((t: number) => { getAudio().currentTime = t; }, [getAudio]);
  const stop = useCallback(() => {
    const a = getAudio();
    a.pause();
    a.src = "";
    setState({ isPlaying: false, isLive: false, currentTitle: null, currentCover: null, streamUrl: null, volume: 1, currentTime: 0, duration: 0 });
  }, [getAudio]);

  return <Ctx.Provider value={{ ...state, playStream, playEpisode, pause, resume, togglePlay, setVolume, seek, stop }}>{children}</Ctx.Provider>;
}

export function useRadioPlayer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRadioPlayer must be used within RadioPlayerProvider");
  return ctx;
}