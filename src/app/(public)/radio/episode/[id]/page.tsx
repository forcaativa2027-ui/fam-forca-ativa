import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { radioBaseUrl } from "@/components/radio/ShareButtons";
import { ShareButtons } from "@/components/radio/ShareButtons";
import { EpisodePlayButton } from "@/components/radio/EpisodePlayButton";

interface PageProps {
  params: { id: string };
}

async function getEpisode(id: string) {
  const supabase = await createClient();
  const { data: episode } = await supabase
    .from("radio_episodes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!episode) return null;
  const { data: config } = await supabase
    .from("radio_config")
    .select("display_name, logo_url")
    .eq("church_id", episode.church_id ?? "")
    .maybeSingle();
  return { episode, config };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const result = await getEpisode(params.id);
  if (!result) {
    return { title: "Episódio não encontrado" };
  }
  const { episode, config } = result;
  const ogImage = episode.cover_url ?? config?.logo_url ?? undefined;
  return {
    title: episode.title,
    description: episode.description ?? `Ouça "${episode.title}" na Rádio Web.`,
    openGraph: {
      title: episode.title,
      description: episode.description ?? undefined,
      type: "music.song",
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
  };
}

export default async function RadioEpisodePage({ params }: PageProps) {
  const result = await getEpisode(params.id);
  if (!result) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto max-w-2xl">
          <div className="rounded-xl border border-gold/30 p-8 text-center">
            <h1 className="font-display text-xl font-bold text-navy">Episódio não encontrado</h1>
            <Link href="/radio" className="mt-4 inline-block text-sm font-semibold text-gold underline">
              Voltar ao player
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { episode, config } = result;
  const url = `${radioBaseUrl()}/radio/episode/${episode.id}`;
  const station = config?.display_name ?? "Rádio Web";

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto max-w-2xl">
        <header className="mb-6">
          <Link
            href="/radio"
            className="inline-flex items-center gap-2 rounded-xl border border-gold/30 px-4 py-2 text-sm font-semibold text-navy hover:bg-gold/10 transition"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao player
          </Link>
        </header>

        <article className="overflow-hidden rounded-2xl border border-gold/30 bg-card">
          {episode.cover_url && (
            <img src={episode.cover_url} alt={episode.title} className="aspect-video w-full object-cover" />
          )}
          <div className="p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-gold">{station}</p>
            <h1 className="mt-1 font-display text-2xl font-bold text-navy">{episode.title}</h1>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted">
              {episode.speaker && (
                <span className="inline-flex items-center gap-1">
                  <User className="h-3.5 w-3.5" /> {episode.speaker}
                </span>
              )}
              {episode.published_at && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(episode.published_at).toLocaleDateString("pt-BR")}
                </span>
              )}
              {episode.duration_seconds != null && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {Math.floor(episode.duration_seconds / 60)} min
                </span>
              )}
            </div>

            {episode.description && (
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted">{episode.description}</p>
            )}

            {episode.auto_summary && (
              <div className="mt-4 rounded-xl border border-gold/30 bg-gold/5 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-gold">Resumo</p>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted">{episode.auto_summary}</p>
              </div>
            )}

            {(episode.auto_tags ?? []).length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {(episode.auto_tags ?? []).map((tag) => (
                  <span key={tag} className="rounded-full border border-gold/30 bg-background px-3 py-1 text-xs text-navy">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {episode.audio_url && (
                <EpisodePlayButton
                  episodeId={episode.id}
                  title={episode.title}
                  coverUrl={episode.cover_url}
                  audioUrl={episode.audio_url}
                />
              )}
              <ShareButtons title={episode.title} url={url} />
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}