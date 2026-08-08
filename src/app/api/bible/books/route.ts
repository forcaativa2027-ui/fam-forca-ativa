import { NextResponse } from "next/server";

const API_BASE = "https://www.abibliadigital.com.br/api";

/**
 * Proxy do lado do servidor pra API pública da Bíblia. Chamar
 * direto do navegador (client-side) esbarra em CORS — o servidor
 * não tem essa restrição, então passamos por aqui.
 */
export async function GET() {
  try {
    const headers: HeadersInit = {};
    const token = process.env.BIBLE_API_TOKEN;
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/books`, { headers, next: { revalidate: 3600 } });
    if (!res.ok) return NextResponse.json({ error: "Falha ao buscar livros" }, { status: res.status });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error("[api/bible/books]", e);
    return NextResponse.json({ error: "Erro ao conectar com a API da Bíblia" }, { status: 502 });
  }
}
