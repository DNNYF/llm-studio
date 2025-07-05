import { z } from "zod";


export const llmConfigSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required."),
  is_active: z.boolean().optional(),
  system_prompt: z.string().max(5000, "System prompt cannot exceed 5000 characters.").optional().default(""),
  max_tokens: z.coerce.number().int().min(1).max(8192),
  temperature: z.coerce.number().min(0).max(2),
  top_k: z.coerce.number().int().min(1),
  top_p: z.coerce.number().min(0).max(1),
  repeat_penalty: z.coerce.number().min(1).max(2),
  stop: z.preprocess(
    (val) => val ?? [], // Handle null/undefined from DB by defaulting to an empty array
    z.array(z.string()).max(4, "You can specify up to 4 stop sequences.")
  ),
  stream: z.boolean().default(false),
});

export type LlmConfig = z.infer<typeof llmConfigSchema>;
