/**
 * Helpers de transcrição/resumo por IA para a Rádio Web (ciclo 7).
 * Usados pela rota /api/radio/transcribe. Heurística serve de fallback
 * quando OPENAI_API_KEY não está configurada.
 */

const PORTUGUESE_STOPWORDS = new Set([
  "a","o","as","os","um","uma","uns","umas","de","do","da","dos","das","em","no","na","nos","nas",
  "para","pra","por","com","sem","sob","sobre","entre","e","ou","mas","que","se","como","quando",
  "onde","qual","quais","quem","cujo","cuja","ele","ela","eles","elas","eu","tu","voce","nos","vos",
  "me","te","se","lhe","nos","vos","lhes","não","nao","sim","ja","ainda","tambem","muito","mais",
  "menos","foi","foram","ser","estar","este","esta","esses","essas","aquele","aquela","isso","isto",
  "aquilo","ha","tem","ter","nada","tudo","outra","outro","outras","outros","sua","suas","seu","seus",
  "pelo","pela","perante","até","ate","apos","depois","antes","contra","cada","algum","alguma",
  "sempre","nunca","aqui","ali","lá","la","bem","mal","etc","porque","então","entao","dela","dele",
  "deles","delas","minha","minhas","meu","meus","nossa","nossas","nosso","nossos","vossa","vossas",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-zà-ú0-9çãõâêîôûáéíóú]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !PORTUGUESE_STOPWORDS.has(w));
}

export function extractTags(text: string, n = 8): string[] {
  const freq = new Map<string, number>();
  for (const w of tokenize(text)) {
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([w]) => w);
}

export function buildSummary(text: string, maxLen = 420): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  const sentences = cleaned.match(/[^.!?]+[.!?]+/g) ?? [cleaned];
  const summary = sentences.slice(0, 3).join(" ");
  return summary.length > maxLen ? `${summary.slice(0, maxLen).trim()}…` : summary;
}

export interface SummaryTagsResult {
  summary: string;
  tags: string[];
}

export async function generateSummaryTags(
  transcript: string,
  openaiKey?: string
): Promise<SummaryTagsResult> {
  if (!transcript || transcript.trim().length < 20) {
    return { summary: buildSummary(transcript), tags: extractTags(transcript) };
  }

  if (!openaiKey) {
    return { summary: buildSummary(transcript), tags: extractTags(transcript) };
  }

  const system =
    "Você é um assistente que resume conteúdos de áudio de uma rádio evangélica. " +
    "Responda SOMENTE com JSON válido no formato {\"summary\":\"resumo em 2-3 frases\",\"tags\":[\"tag1\",\"tag2\"]}. " +
    "As tags devem ser palavras-chave curtas em português (5 a 8).";

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          { role: "system", content: system },
          { role: "user", content: `Transcrição:\n${transcript.slice(0, 12000)}` },
        ],
      }),
    });
    if (!res.ok) {
      throw new Error(`OpenAI ${res.status}`);
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    const cleaned = content
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
    const parsed = JSON.parse(cleaned) as SummaryTagsResult;
    return {
      summary: String(parsed.summary ?? "").trim(),
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8).map(String) : [],
    };
  } catch {
    return { summary: buildSummary(transcript), tags: extractTags(transcript) };
  }
}

export async function transcribeAudio(
  audio: ArrayBuffer,
  openaiKey: string,
  mimeType = "audio/mpeg",
  filename = "audio.mp3"
): Promise<string> {
  const form = new FormData();
  form.append("model", "whisper-1");
  form.append("language", "pt");
  form.append("file", new Blob([audio], { type: mimeType }), filename);

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey}` },
    body: form,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Whisper ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = String(data?.text ?? "").trim();
  if (!text) throw new Error("Whisper retornou transcrição vazia.");
  return text;
}

export function inferMimeFromUrl(url: string): { mime: string; filename: string } {
  const clean = url.split("?")[0].split("#")[0].toLowerCase();
  if (clean.endsWith(".m4a")) return { mime: "audio/mp4", filename: "audio.m4a" };
  if (clean.endsWith(".ogg")) return { mime: "audio/ogg", filename: "audio.ogg" };
  if (clean.endsWith(".webm")) return { mime: "audio/webm", filename: "audio.webm" };
  if (clean.endsWith(".wav")) return { mime: "audio/wav", filename: "audio.wav" };
  return { mime: "audio/mpeg", filename: "audio.mp3" };
}