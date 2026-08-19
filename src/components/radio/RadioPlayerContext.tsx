"use client";
import { createContext, useContext, useState, useRef, useCallback, useEffect, type ReactNode } from "react";

export type RadioStreamStatus = "idle" | "loading" | "playing" | "error";

interface RadioPlayerState {
  isPlaying: boolean;
  isLive: boolean;
  currentTitle: string | null;
  currentCover: string | null;
  streamUrl: string | null;
  volume: number;
  currentTime: number;
  duration: number;
  hasError: boolean;
  errorMessage: string | null;
  streamStatus: RadioStreamStatus;
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
  retry: () => void;
}

const Ctx = createContext<RadioPlayerCtx | null>(null);

const INITIAL_STATE: RadioPlayerState = {
  isPlaying: false, isLive: false, currentTitle: null, currentCover: null,
  streamUrl: null, volume: 1, currentTime: 0, duration: 0,
  hasError: false, errorMessage: null, streamStatus: "idle",
};

export function RadioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const retryRef = useRef<{ timer: ReturnType<typeof setTimeout> | null; count: number }>({ timer: null, count: 0 });
  const [state, setState] = useState<RadioPlayerState>(INITIAL_STATE);

  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    return audioRef.current;
  }, []);

  // Listener de erro e fim de reprodução
  useEffect(() => {
    const a = getAudio();
    const onError = () => {
      const el = getAudio();
      setState(s => ({
        ...s, isPlaying: false, hasError: true,
        errorMessage: s.isLive ? "Stream indisponível no momento." : "Não foi possível reproduzir este conteúdo.",
        streamStatus: "error",
      }));
    };
    const onEnded = () => {
      setState(s => (s.isLive ? s : { ...s, isPlaying: false, streamStatus: "idle" }));
    };
    const onTimeUpdate = () => {
      const el = getAudio();
      setState(s => (s.currentTime === el.currentTime && s.duration === el.duration ? s : { ...s, currentTime: el.currentTime, duration: el.duration || 0 }));
    };
    a.addEventListener("error", onError);
    a.addEventListener("ended", onEnded);
    a.addEventListener("timeupdate", onTimeUpdate);
    return () => {
      a.removeEventListener("error", onError);
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [getAudio]);

  const startPlayback = useCallback((a: HTMLAudioElement) => {
    setState(s => ({ ...s, streamStatus: "loading", hasError: false, errorMessage: null }));
    a.play().catch(() => {
      setState(s => ({ ...s, isPlaying: false, hasError: true, errorMessage: "Não foi possível iniciar a reprodução.", streamStatus: "error" }));
    });
  }, []);

  const playStream = useCallback((url: string, title?: string, cover?: string) => {
    const a = getAudio();
    a.src = url;
    a.loop = true;
    setState(s => ({ ...s, isLive: true, currentTitle: title ?? null, currentCover: cover ?? null, streamUrl: url, isPlaying: true }));
    startPlayback(a);
  }, [getAudio, startPlayback]);

  const playEpisode = useCallback((url: string, title?: string, cover?: string) => {
    const a = getAudio();
    a.src = url;
    a.loop = false;
    setState(s => ({ ...s, isLive: false, currentTitle: title ?? null, currentCover: cover ?? null, streamUrl: url, isPlaying: true }));
    startPlayback(a);
  }, [getAudio, startPlayback]);

  const pause = useCallback(() => { getAudio().pause(); setState(s => ({ ...s, isPlaying: false })); }, [getAudio]);
  const resume = useCallback(() => {
    const a = getAudio();
    setState(s => ({ ...s, streamStatus: "loading", hasError: false }));
    a.play().catch(() => setState(s => ({ ...s, isPlaying: false, hasError: true, errorMessage: "Não foi possível retomar a reprodução.", streamStatus: "error" })));
  }, [getAudio]);
  const togglePlay = useCallback(() => { state.isPlaying ? pause() : resume(); }, [state.isPlaying, pause, resume]);
  const setVolume = useCallback((v: number) => { getAudio().volume = v; setState(s => ({ ...s, volume: v })); }, [getAudio]);
  const seek = useCallback((t: number) => { getAudio().currentTime = t; }, [getAudio]);
  const stop = useCallback(() => {
    if (retryRef.current.timer) clearTimeout(retryRef.current.timer);
    retryRef.current.count = 0;
    const a = getAudio();
    a.pause();
    a.src = "";
    a.loop = false;
    setState({ ...INITIAL_STATE, volume: state.volume });
  }, [getAudio, state.volume]);

  // Retry automático para stream ao vivo (3 tentativas com backoff)
  const retry = useCallback(() => {
    const a = getAudio();
    if (!state.streamUrl) return;
    setState(s => ({ ...s, hasError: false, errorMessage: null, streamStatus: "loading" }));
    a.src = state.streamUrl;
    a.loop = state.isLive;
    a.play().catch(() => {
      retryRef.current.count += 1;
      if (retryRef.current.count < 3) {
        retryRef.current.timer = setTimeout(() => retry(), 2000 * retryRef.current.count);
      } else {
        setState(s => ({ ...s, isPlaying: false, hasError: true, errorMessage: "Stream indisponível. Tente novamente mais tarde.", streamStatus: "error" }));
      }
    });
  }, [getAudio, state.streamUrl, state.isLive]);

  useEffect(() => () => { if (retryRef.current.timer) clearTimeout(retryRef.current.timer); }, []);

  return (
    <Ctx.Provider value={{ ...state, playStream, playEpisode, pause, resume, togglePlay, setVolume, seek, stop, retry }}>
      {children}
    </Ctx.Provider>
  );
}

export function useRadioPlayer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRadioPlayer must be used within RadioPlayerProvider");
  return ctx;
}