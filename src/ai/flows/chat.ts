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

// Fungsi fetch dengan timeout
async function fetchWithTimeout(resource: string, options = {}, timeout = 30000) {
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
  
  // Ganti prompt jadi messages (array)
  const messages = formatMessages(history, message, config?.system_prompt);

  // SUSUN REQUEST SESUAI API YANG BENAR
  const requestBody: any = {
    model: config.name || "gema-4b",
    messages,
    max_tokens: config?.max_tokens,
    temperature: config?.temperature,
    repeat_penalty: config?.repeat_penalty,
    stream: false, // paksa non-stream agar response pasti JSON
  };
  if (typeof config.top_k === "number") requestBody.top_k = config.top_k;
  if (typeof config.top_p === "number") requestBody.top_p = config.top_p;
  if (Array.isArray(config.stop) && config.stop.length > 0) requestBody.stop = config.stop;

  try {
    const response = await fetchWithTimeout(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }, 30000);

    // Cek header content-type
    const contentType = response.headers.get("content-type") || "";

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errText}`);
    }

    // Kalau bukan JSON, kemungkinan streaming
    if (contentType.includes("application/json")) {
      const data = await response.json();
      const resultText = data?.choices?.[0]?.message?.content;
      if (typeof resultText !== 'string') {
          console.error("Unexpected API response format:", data);
          return "Error: An unexpected response was received from the server (no content).";
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
        return "Error: No valid data chunk received from the server.";
      }
      lastLine = lastLine.replace(/^data: /, '').trim();
      let parsed: any;
      try {
        parsed = JSON.parse(lastLine);
      } catch (e) {
        console.error("Failed to parse streamed JSON:", lastLine, e);
        return "Error communicating with the AI service (stream response parse error).";
      }
      const resultText = parsed?.choices?.[0]?.delta?.content || parsed?.choices?.[0]?.message?.content;
      if (typeof resultText !== 'string') {
        console.error("Unexpected streamed response format:", parsed);
        return "Error: An unexpected response was received from the server (stream, no content).";
      }
      return resultText.trim();
    }
  } catch(error: any) {
    console.error("Failed to fetch from Heroku API:", error);
    // Kembalikan pesan error agar selalu muncul di UI, tidak silent
    return `Error communicating with the AI service: ${error?.message || String(error)}`;
  }
}