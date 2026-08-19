import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();

  const { data: config } = await supabase.from("radio_config").select("*").limit(1).maybeSingle();
  const { data: episodes } = await supabase
    .from("radio_episodes")
    .select("*")
    .eq("status", "published")
    .eq("is_podcast", true)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(50);

  const title = config?.display_name ?? "Rádio Web";
  const description = config?.description ?? "Podcasts e episódios da rádio.";
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cec-painel.vercel.app";

  const items = (episodes ?? [])
    .map((e) => {
      const guid = `${baseUrl}/radio/episode/${e.id}`;
      const pubDate = e.published_at ? new Date(e.published_at).toUTCString() : new Date().toUTCString();
      return `    <item>
      <title><![CDATA[${e.title}]]></title>
      <link>${guid}</link>
      <guid>${guid}</guid>
      <pubDate>${pubDate}</pubDate>
      <enclosure url="${e.audio_url}" type="audio/mpeg" length="${e.duration_seconds ?? 0}"/>
      ${e.description ? `<description><![CDATA[${e.description}]]></description>` : ""}
      ${e.speaker ? `<itunes:author><![CDATA[${e.speaker}]]></itunes:author>` : ""}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${title}]]></title>
    <link>${baseUrl}/radio</link>
    <description><![CDATA[${description}]]></description>
    <language>pt-br</language>
    <atom:link href="${baseUrl}/radio/feed.xml" rel="self" type="application/rss+xml"/>
    ${config?.logo_url ? `<image><url>${config.logo_url}</url><title>${title}</title><link>${baseUrl}/radio</link></image>` : ""}
${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
