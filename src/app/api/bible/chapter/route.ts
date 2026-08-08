import { NextResponse } from "next/server";

const API_BASE = "https://www.abibliadigital.com.br/api";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const version = searchParams.get("version") ?? "nvi";
  const book = searchParams.get("book");
  const chapter = searchParams.get("chapter");
  if (!book || !chapter) return NextResponse.json({ error: "Parâmetros faltando" }, { status: 400 });

  try {
    const headers: HeadersInit = {};
    const token = process.env.BIBLE_API_TOKEN;
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/verses/${version}/${book}/${chapter}`, { headers, next: { revalidate: 3600 } });
    if (!res.ok) return NextResponse.json({ error: "Falha ao buscar capítulo" }, { status: res.status });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error("[api/bible/chapter]", e);
    return NextResponse.json({ error: "Erro ao conectar com a API da Bíblia" }, { status: 502 });
  }
}
