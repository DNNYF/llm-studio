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

// Ubah cara membuat list messages sesuai standar OpenAI
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

export async function chat({history, message}: ChatInput): Promise<ChatOutput> {
  const apiUrl = process.env.HEROKU_API_URL;

  if (!apiUrl) {
    throw new Error("HEROKU_API_URL is not defined in the environment variables.");
  }
  
  const config = await getActiveConfigForChat();
  if (!config) {
      return "AI configuration is not available at the moment. Please contact an administrator.";
  }
  
  // Ganti prompt jadi messages (array)
  const messages = formatMessages(history, message, config?.system_prompt);

  // SUSUN REQUEST SESUAI API YANG BENAR
  const requestBody: any = {
    model: config.name || "gema-4b",
    messages,
    max_tokens: config?.max_tokens,
    temperature: config?.temperature,
    repeat_penalty: config?.repeat_penalty,
    // Pastikan default stream: false agar tidak streaming jika tidak di-support
    stream: false,
  };
  if (typeof config.top_k === "number") requestBody.top_k = config.top_k;
  if (typeof config.top_p === "number") requestBody.top_p = config.top_p;
  if (Array.isArray(config.stop) && config.stop.length > 0) requestBody.stop = config.stop;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // Cek header content-type
    const contentType = response.headers.get("content-type") || "";

    // Kalau bukan JSON, kemungkinan streaming
    if (contentType.includes("application/json")) {
      const data = await response.json();
      const resultText = data?.choices?.[0]?.message?.content;
      if (typeof resultText !== 'string') {
          console.error("Unexpected API response format:", data);
          throw new Error("An unexpected response was received from the server.");
      }
      return resultText.trim();
    } else {
      // Streaming (event stream) mode
      const text = await response.text();
      // Cari baris "data: {...}"
      const lines = text.split('\n').filter(line => line.startsWith('data: '));
      // Cari baris terakhir sebelum "[DONE]"
      let lastLine = lines.reverse().find(line => {
        return line && line !== 'data: [DONE]';
      });
      if (!lastLine) {
        throw new Error("No valid data chunk received from the server.");
      }
      // Potong "data: " lalu parse JSON
      lastLine = lastLine.replace(/^data: /, '').trim();
      let parsed;
      try {
        parsed = JSON.parse(lastLine);
      } catch (e) {
        console.error("Failed to parse streamed JSON:", lastLine, e);
        throw new Error(`Error communicating with the AI service: ${e instanceof Error ? e.message : String(e)}`);
      }
      const resultText = parsed?.choices?.[0]?.delta?.content || parsed?.choices?.[0]?.message?.content;
      if (typeof resultText !== 'string') {
        console.error("Unexpected streamed response format:", parsed);
        throw new Error("An unexpected response was received from the server.");
      }
      return resultText.trim();
    }
  } catch(error) {
    console.error("Failed to fetch from Heroku API:", error);
    if (error instanceof Error) {
        return `Error communicating with the AI service: ${error.message}`;
    }
    return "An unknown error occurred while communicating with the AI service.";
  }
}