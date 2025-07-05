'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { llmConfigSchema, type LlmConfig } from '@/lib/schemas';

export async function logout() {
  cookies().delete('session');
  redirect('/login');
}


export async function getActiveLlmConfig(): Promise<LlmConfig | null> {
  try {
    const { rows } = await db.query('SELECT * FROM llm_configs WHERE is_active = true LIMIT 1');
    if (rows.length === 0) {
      console.warn("No active LLM config found in the database.");
      return null;
    }
    
    const parsed = llmConfigSchema.safeParse(rows[0]);
    if (!parsed.success) {
      console.error("Failed to parse active config from DB:", parsed.error);
      return null;
    }
    return parsed.data;
  } catch (error) {
    console.error('Database Error: Failed to fetch active LLM config.', error);
    return null;
  }
}

export async function updateLlmConfig(data: LlmConfig) {
  const parsed = llmConfigSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, message: "Invalid data provided: " + JSON.stringify(parsed.error.flatten().fieldErrors) };
  }
  
  const { id, ...configToUpdate } = parsed.data;

  if (!id) {
    return { success: false, message: "Config ID is missing." };
  }

  try {
    // Using a transaction for atomicity
    await db.query('BEGIN');

    const updateQuery = `
      UPDATE llm_configs
      SET name = $1, system_prompt = $2, max_tokens = $3, temperature = $4, top_k = $5, top_p = $6, repeat_penalty = $7, stop = $8, stream = $9
      WHERE id = $10
    `;
    
    await db.query(updateQuery, [
      configToUpdate.name,
      configToUpdate.system_prompt,
      configToUpdate.max_tokens,
      configToUpdate.temperature,
      configToUpdate.top_k,
      configToUpdate.top_p,
      configToUpdate.repeat_penalty,
      configToUpdate.stop,
      configToUpdate.stream,
      id
    ]);

    const historyQuery = `
      INSERT INTO llm_config_history (config_id, action, changes)
      VALUES ($1, 'UPDATE', $2::jsonb)
    `;
    
    // Storing the entire new config state as the change record
    await db.query(historyQuery, [id, JSON.stringify(configToUpdate)]);

    await db.query('COMMIT');

    revalidatePath('/admin'); // Re-fetch data on the admin page
    revalidatePath('/chat');   // Make sure chat flow gets the latest data

    return { success: true, message: "Configuration updated successfully!" };

  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Database Error: Failed to update LLM config.', error);
    if (error instanceof Error) {
        return { success: false, message: `Database error: ${error.message}` };
    }
    return { success: false, message: 'An unknown database error occurred.' };
  }
}
