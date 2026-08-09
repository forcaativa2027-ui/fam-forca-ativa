import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Capítulo da Bíblia — vem do nosso próprio banco (tabela
 * bible_verses), sem depender de API externa. Respeita a versão
 * pedida (Fase 2 — Comparação de Traduções: ACF ou AA).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const version = searchParams.get("version") || "acf";
  const book = searchParams.get("book");
  const chapter = searchParams.get("chapter");
  if (!book || !chapter) return NextResponse.json({ error: "Parâmetros faltando" }, { status: 400 });

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const [{ data: bookData }, { data: verses, error }] = await Promise.all([
      supabase.from("bible_books").select("*").eq("abbrev", book).maybeSingle(),
      supabase.from("bible_verses").select("verse, text").eq("version", version).eq("book_abbrev", book).eq("chapter", Number(chapter)).order("verse"),
    ]);
    if (error) throw error;
    if (!bookData || !verses || verses.length === 0) {
      return NextResponse.json({ error: "Capítulo não encontrado" }, { status: 404 });
    }

    // Formato compatível com o que o app já espera
    return NextResponse.json({
      book: { abbrev: { pt: bookData.abbrev, en: bookData.abbrev }, name: bookData.name, author: "", group: "", version },
      chapter: { number: Number(chapter), verses: verses.length },
      verses: verses.map((v) => ({ number: v.verse, text: v.text })),
    });
  } catch (e) {
    console.error("[api/bible/chapter]", e);
    return NextResponse.json({ error: "Erro ao buscar capítulo" }, { status: 500 });
  }
}
