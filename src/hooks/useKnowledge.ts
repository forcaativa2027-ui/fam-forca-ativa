"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { listTopics, listTracks, listContents, searchKnowledge, getTrackWithItems, listSources, type KnowledgeTopic, type KnowledgeTrack, type KnowledgeContent, type KnowledgeSource } from "@/services/knowledge";

export function useKnowledgeTopics() {
  const [topics, setTopics] = useState<KnowledgeTopic[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { listTopics(supabase as any).then(setTopics).finally(() => setLoading(false)); }, []);
  return { topics, loading };
}
export function useKnowledgeTracks() {
  const [tracks, setTracks] = useState<KnowledgeTrack[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { listTracks(supabase as any).then(setTracks).finally(() => setLoading(false)); }, []);
  return { tracks, loading };
}
export function useKnowledgeContents(params: { topicId?: string; level?: string; q?: string } = {}) {
  const [contents, setContents] = useState<KnowledgeContent[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    const data = await listContents(params, supabase as any);
    setContents(data);
    setLoading(false);
  }, [params.topicId, params.level, params.q]);
  useEffect(() => { load(); }, [load]);
  return { contents, loading, reload: load };
}
export function useKnowledgeSearch(q: string) {
  const [results, setResults] = useState<KnowledgeContent[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!q || q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      const r = await searchKnowledge(q, supabase as any);
      setResults(r);
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);
  return { results, loading };
}
export function useTrack(slug: string) {
  const [track, setTrack] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!slug) return;
    getTrackWithItems(slug, supabase as any).then(setTrack).finally(() => setLoading(false));
  }, [slug]);
  return { track, loading };
}
export function useSources() {
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { listSources(supabase as any).then(setSources).finally(() => setLoading(false)); }, []);
  return { sources, loading };
}
