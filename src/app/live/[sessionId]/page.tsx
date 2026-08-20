"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLiveCurrent, useLiveOnairLyric, useLiveSessionTheme } from "@/hooks/use-queries";
import { getChapter } from "@/services/bibleReader";

const DEFAULT_VERSION = "acf";
const DEFAULT_THEME = { bg: "#0f172a", text: "#ffffff", accent: "#d4af37", fontDisplay: "font-display" };

export default function LiveProjectionPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params?.sessionId ?? "";
  const { data: current } = useLiveCurrent(sessionId);
  const onairLyric = useLiveOnairLyric(sessionId, current?.kind === "lyric");
  const { data: theme } = useLiveSessionTheme(sessionId);
  const [bible, setBible] = useState<{ book: string; chapter: number; verses: { number: number; text: string }[] } | null>(null);
  const [bibleErr, setBibleErr] = useState(false);

  const t = theme ?? DEFAULT_THEME;

  // Resolve a referência bíblica do item no ar (ex.: "sl 23:1-6") via API existente.
  useEffect(() => {
    let cancelled = false;
    setBible(null);
    setBibleErr(false);
    if (!current || current.kind !== "bible" || !current.ref) return;

    const m = current.ref.match(/^([0-9a-z]+)\s*(\d+)(?::(\d+)(?:-(\d+))?)?$/i);
    if (!m) { setBibleErr(true); return; }
    const book = m[1].toLowerCase();
    const chapter = Number(m[2]);

    getChapter(DEFAULT_VERSION, book, chapter).then((data) => {
      if (cancelled) return;
      if (!data) { setBibleErr(true); return; }
      const start = m[3] ? Number(m[3]) : 1;
      const end = m[4] ? Number(m[4]) : start;
      setBible({
        book: data.book.name,
        chapter,
        verses: data.verses.filter((v) => v.number >= start && v.number <= end),
      });
    });
    return () => { cancelled = true; };
  }, [current]);

  const kind = current?.kind ?? "blank";

  return (
    <main
      className="flex min-h-screen items-center justify-center p-10"
      style={{ backgroundColor: t.bg, color: t.text }}
    >
      {kind === "blank" && (
        <p className="text-2xl" style={{ opacity: 0.4 }}>—</p>
      )}
      {kind === "bible" && !bible && !bibleErr && (
        <p className="text-xl" style={{ opacity: 0.5 }}>Carregando...</p>
      )}
      {kind === "bible" && bibleErr && (
        <p className="text-xl" style={{ opacity: 0.6 }}>Referência inválida.</p>
      )}
      {kind === "bible" && bible && (
        <div className="max-w-4xl text-center">
          <p className="mb-8 text-3xl font-bold" style={{ color: t.accent, fontFamily: "var(--font-display), serif" }}>
            {bible.book} {bible.chapter}
          </p>
          <div className="space-y-6">
            {bible.verses.map((v) => (
              <p key={v.number} className="text-3xl leading-relaxed">
                <sup className="mr-2 text-xl" style={{ color: t.accent }}>{v.number}</sup>
                {v.text}
              </p>
            ))}
          </div>
        </div>
      )}
      {kind === "lyric" && !onairLyric?.data && (
        <p className="text-xl" style={{ opacity: 0.5 }}>Carregando letra...</p>
      )}
      {kind === "lyric" && onairLyric?.data && (
        <LyricProjection
          lyric={onairLyric.data}
          slide={typeof current?.payload?.slide === "number" ? current.payload.slide : 0}
          accent={t.accent}
        />
      )}
    </main>
  );
}

function LyricProjection({
  lyric, slide, accent,
}: {
  lyric: { title: string; author: string | null; lyrics: { type: string; lines: string[] }[] };
  slide: number;
  accent: string;
}) {
  const blocks = lyric.lyrics;
  const safeSlide = blocks.length > 0 ? Math.min(slide, blocks.length - 1) : 0;
  const block = blocks[safeSlide];

  return (
    <div className="max-w-4xl text-center">
      <p className="mb-2 text-3xl font-bold" style={{ color: accent, fontFamily: "var(--font-display), serif" }}>
        {lyric.title}
      </p>
      {lyric.author && <p className="mb-8 text-lg" style={{ opacity: 0.5 }}>{lyric.author}</p>}
      {block ? (
        <div className="space-y-3" key={safeSlide}>
          {block.lines.map((ln, li) => (
            <p key={li} className="text-3xl leading-relaxed">{ln}</p>
          ))}
        </div>
      ) : (
        <p className="text-xl" style={{ opacity: 0.6 }}>Sem letra para este bloco.</p>
      )}
    </div>
  );
}