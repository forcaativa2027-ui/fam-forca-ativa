import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Lista de livros da Bíblia — agora vem do nosso próprio banco
 * (tabela bible_books), sem depender de nenhuma API externa.
 */
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data, error } = await supabase.from("bible_books").select("*").order("order_index");
    if (error) throw error;

    // Formato compatível com o que o app já espera (abbrev.pt / abbrev.en)
    const books = (data ?? []).map((b) => ({
      abbrev: { pt: b.abbrev, en: b.abbrev },
      author: "", chapters: b.chapters, group: "", name: b.name, testament: b.testament,
    }));
    return NextResponse.json(books);
  } catch (e) {
    console.error("[api/bible/books]", e);
    return NextResponse.json({ error: "Erro ao buscar livros" }, { status: 500 });
  }
}
