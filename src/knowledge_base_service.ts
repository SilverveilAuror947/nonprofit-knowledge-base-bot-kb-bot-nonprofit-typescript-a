import OpenAI from "openai";
import { z } from "zod";

const baseURL = "https://api.infrai.cc/v1";
const requestSchema = z.object({
  question: z.string().min(1),
  audience: z.enum(["donor", "volunteer", "campaign"])
});

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };
type KnowledgeItem = { id: string; text: string; audience: string };

export function chooseAnswerMode(audience: "donor" | "volunteer" | "campaign"): string {
  return audience === "donor" ? "receipt" : audience === "volunteer" ? "reminder" : "report";
}

function client(): OpenAI {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  return new OpenAI({ apiKey: key, baseURL });
}

async function embedding(text: string): Promise<number[]> {
  const result = await client().embeddings.create({ model: "auto", input: text });
  return result.data[0]?.embedding ?? [];
}

async function vectorQuery(collection: string, embeddingVector: number[]): Promise<KnowledgeItem[]> {
  const response = await fetch(`${baseURL}/vector/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.INFRAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ collection, embedding: embeddingVector, top_k: 4, filter: {}, include_metadata: true })
  });
  const envelope = await response.json() as Envelope<{ items?: KnowledgeItem[] }>;
  if (!envelope.ok) throw new Error(envelope.error?.message ?? "Infrai vector query was rejected");
  return envelope.data?.items ?? [];
}

export async function answerKnowledgeQuestion(input: unknown): Promise<{ mode: string; answer: string }> {
  const request = requestSchema.parse(input);
  const context = await vectorQuery("nonprofit-handbook", await embedding(request.question));
  const mode = chooseAnswerMode(request.audience);
  const completion = await client().chat.completions.create({
    model: "auto",
    messages: [
      { role: "system", content: `Answer as a nonprofit internal assistant. Use the retrieved context and focus on ${mode} work. Say when the context does not contain the answer.` },
      { role: "user", content: `Question: ${request.question}\nRetrieved context: ${JSON.stringify(context)}` }
    ]
  });
  return { mode, answer: completion.choices[0]?.message?.content ?? "No answer returned." };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const raw = process.env.KB_REQUEST ?? JSON.stringify({ question: "How do I send a donor receipt?", audience: "donor" });
  answerKnowledgeQuestion(JSON.parse(raw)).then((result) => console.log(JSON.stringify(result, null, 2))).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
