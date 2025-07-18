'use server';
import { z } from 'zod';
import type { Message } from '@/types';
import { db } from '@/lib/db';
import { llmConfigSchema, type LlmConfig } from '@/lib/schemas';

const ChatInputSchema = z.object({
  history: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
  })),
  message: z.string(),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.string();
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

async function getActiveConfigForChat(): Promise<LlmConfig | null> {
    try {
        const { rows } = await db.query('SELECT * FROM llm_configs WHERE is_active = true LIMIT 1');
        if (rows.length === 0) {
            console.error("Chat Error: No active LLM config found.");
            return null;
        };

        const parsed = llmConfigSchema.safeParse(rows[0]);
        if (!parsed.success) {
            console.error("Chat Error: Failed to parse active config from DB:", parsed.error);
            return null;
        }
        return parsed.data;
    } catch (e) {
        console.error("Chat Error: Failed to get active LLM config for chat", e);
        return null;
    }
}

function formatMessages(history: Message[], newMessage: string, systemPrompt?: string) {
    const messages: {role: string, content: string}[] = [];
    if (systemPrompt) {
        messages.push({ role: "system", content: systemPrompt });
    }
    for (const msg of history) {
        messages.push({ role: msg.role, content: msg.content });
    }
    messages.push({ role: "user", content: newMessage });
    return messages;
}

async function fetchWithTimeout(resource: string, options: any = {}, timeout = 60000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        // @ts-ignore
        const response = await fetch(resource, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (e) {
        clearTimeout(id);
        throw e;
    }
}

export async function chat({history, message}: ChatInput): Promise<ChatOutput> {
  const apiUrl = process.env.HEROKU_API_URL;
  if (!apiUrl) {
    return "Error: HEROKU_API_URL is not defined in the environment variables.";
  }
  const config = await getActiveConfigForChat();
  if (!config) {
      return "AI configuration is not available at the moment. Please contact an administrator.";
  }

  const messages = formatMessages(history, message, config?.system_prompt);

  const requestBody: any = {
    model: config.name || "gema-4b",
    messages,
    max_tokens: config?.max_tokens,
    temperature: config?.temperature,
    repeat_penalty: config?.repeat_penalty,
  };
  if (typeof config.top_k === "number") requestBody.top_k = config.top_k;
  if (typeof config.top_p === "number") requestBody.top_p = config.top_p;
  if (Array.isArray(config.stop) && config.stop.length > 0) requestBody.stop = config.stop;

  try {
    const response = await fetchWithTimeout(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    }, 60000);

    // Logging status dan headers
    console.log("==[LLM CHAT API]==");
    console.log("URL:", apiUrl);
    console.log("Request Body:", JSON.stringify(requestBody));
    console.log("Response status:", response.status);
    console.log("Response headers:", JSON.stringify([...response.headers]));

    // Baca response mentah sebagai string supaya bisa dilihat isinya
    const rawText = await response.text();
    console.log("Raw response from API:", rawText);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${rawText}`);
    }

    // Parsing JSON dari response mentah
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      console.error("Error parsing JSON response:", e);
      return "Error: Failed to parse API response as JSON. Silakan cek log server untuk detail.";
    }

    // Ambil response dari choices[0].message.content
    const resultText = data?.choices?.[0]?.message?.content;
    if (typeof resultText !== 'string') {
      console.error("Unexpected API response format:", data);
      return "Error: An unexpected response was received from the server (no content).";
    }
    return resultText.trim();

  } catch (error: any) {
    console.error("Failed to fetch from Heroku API:", error);
    if (error.name === 'AbortError') {
      return "Error: Request timeout. Server is too slow or busy, please try again.";
    }
    return `Error communicating with the AI service: ${error?.message || String(error)}`;
  }
}