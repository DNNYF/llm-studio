'use server';
/**
 * @fileOverview A chat flow that responds to user messages via a Heroku API.
 *
 * - chat - A function that handles the chat process.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */
import {z} from 'zod';
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

function formatPrompt(history: Message[], newMessage: string, systemPrompt?: string): string {
    let prompt = systemPrompt ? `${systemPrompt}\n\n` : "";
    
    if (history.length > 0) {
        prompt += history.map(msg => `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`).join('\n') + '\n';
    }
    prompt += `Human: ${newMessage}\nAssistant:`;
    return prompt;
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
  
  // The system_prompt from the admin page is now passed into the main prompt.
  const fullPrompt = formatPrompt(history, message, config?.system_prompt);

  const requestBody = {
    prompt: fullPrompt,
    max_tokens: config?.max_tokens,
    temperature: config?.temperature,
    top_k: config?.top_k,
    top_p: config?.top_p,
    repeat_penalty: config?.repeat_penalty,
    stop: config?.stop,
  };
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Heroku API Error:", errorBody);
        throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
    }

    const data = await response.json();

    // Assuming the API returns a JSON object with a "completion" or "text" or "response" field
    const resultText = data.completion || data.text || data.response;

    if (typeof resultText !== 'string') {
        console.error("Unexpected API response format:", data);
        throw new Error("Received an unexpected format from the API.");
    }
    
    return resultText;

  } catch(error) {
    console.error("Failed to fetch from Heroku API:", error);
    if (error instanceof Error) {
        return `Error communicating with the AI service: ${error.message}`;
    }
    return "An unknown error occurred while communicating with the AI service.";
  }
}
