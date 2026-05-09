import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

export const runtime = "nodejs";

const MODEL = "gemini-2.5-flash";

const SYSTEM_PROMPT = `You are an experienced hiring manager and interviewer.
Generate exactly three thoughtful interview questions tailored to the given job title.
Mix question types: one behavioral (past experience / STAR-friendly), one role-specific
(testing core skills for that title), and one situational (a realistic scenario the
candidate would face). Questions must be open-ended, concise (one or two sentences),
and avoid yes/no phrasing. Do not number the questions.`;

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is not configured. Missing GEMINI_API_KEY." },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const jobTitle =
    typeof body === "object" && body !== null && "jobTitle" in body
      ? String((body as { jobTitle: unknown }).jobTitle ?? "").trim()
      : "";

  if (!jobTitle) {
    return NextResponse.json({ error: "jobTitle is required." }, { status: 400 });
  }
  if (jobTitle.length > 120) {
    return NextResponse.json({ error: "jobTitle is too long (max 120 chars)." }, { status: 400 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: MODEL,
      contents: `Job title: ${jobTitle}`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              minItems: 3,
              maxItems: 3,
            },
          },
          required: ["questions"],
        },
        temperature: 0.7,
      },
    });

    const text = result.text;
    if (!text) throw new Error("Empty response from model.");

    const parsed = JSON.parse(text) as { questions?: unknown };
    const questions = Array.isArray(parsed.questions)
      ? parsed.questions.filter((q): q is string => typeof q === "string" && q.trim().length > 0)
      : [];

    if (questions.length < 3) {
      throw new Error("Model did not return three questions.");
    }

    return NextResponse.json({ questions: questions.slice(0, 3) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error.";
    return NextResponse.json({ error: `Failed to generate questions: ${message}` }, { status: 502 });
  }
}
