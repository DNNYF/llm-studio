
"use client";

import { useState, type FC } from "react";
import { useForm, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BotMessageSquare, FileKey2, Loader2, Save, Terminal, TestTube2, Workflow } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { updateLlmConfig } from "@/app/admin/actions";
import { llmConfigSchema, type LlmConfig } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface SliderFieldProps {
  control: Control<LlmConfig>;
  name: keyof LlmConfig;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
}

const SliderField: FC<SliderFieldProps> = ({ control, name, label, description, min, max, step }) => (
  <FormField
    control={control}
    name={name}
    render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormDescription>{description}</FormDescription>
        <div className="flex items-center gap-4 pt-2">
          <FormControl>
            <Slider
              min={min}
              max={max}
              step={step}
              value={[Number(field.value)]}
              onValueChange={(vals) => field.onChange(vals[0])}
              className="w-full"
            />
          </FormControl>
          <Input
            type="number"
            min={min}
            max={max}
            step={step}
            value={field.value}
            onChange={field.onChange}
            className="w-28 text-center"
          />
        </div>
        <FormMessage />
      </FormItem>
    )}
  />
);

const CurlPreview: FC<{ config: LlmConfig; apiUrl: string }> = ({ config, apiUrl }) => {
    const { system_prompt, ...apiParams } = config;
    const promptExample = `${system_prompt ? `${system_prompt}\\n\\n` : ""}Human: Your prompt here\\nAssistant:`;

    const dataPayload = {
        prompt: promptExample,
        ...apiParams,
    };

    const dataString = JSON.stringify(dataPayload, null, 2);

    const curlCommand = `curl -X POST ${apiUrl} \\
-H "Content-Type: application/json" \\
-d '${dataString}'`;

    return (
        <pre className="mt-4 overflow-x-auto rounded-lg bg-muted p-4 text-sm text-muted-foreground">
        <code>{curlCommand}</code>
        </pre>
    );
};

export function LlmConfigForm({ initialConfig, apiUrl }: { initialConfig: LlmConfig; apiUrl: string }) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<LlmConfig>({
    resolver: zodResolver(llmConfigSchema),
    defaultValues: {
      ...initialConfig,
      // Ensure `stop` is always an array to prevent client-side errors
      stop: Array.isArray(initialConfig.stop) ? initialConfig.stop : [],
    },
    mode: "onChange",
  });

  const watchedValues = form.watch();

  async function onSubmit(data: LlmConfig) {
    setIsSaving(true);
    const result = await updateLlmConfig(data);
    setIsSaving(false);

    if (result.success) {
      toast({
        title: "Success!",
        description: result.message,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.message,
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField control={form.control} name="id" render={({ field }) => <input type="hidden" {...field} />} />
        
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
             <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <Workflow className="h-6 w-6 text-accent" />
                    <div>
                    <CardTitle>General Configuration</CardTitle>
                    <CardDescription>Basic settings for this configuration.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Configuration Name</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. Creative Writer" {...field} />
                        </FormControl>
                        <FormDescription>A unique name for this set of parameters.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="stream"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel>Stream Response</FormLabel>
                                <FormDescription>
                                    Receive the response as a stream of tokens. (Note: UI does not yet support streaming).
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                    />
                </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <BotMessageSquare className="h-6 w-6 text-accent" />
                <div>
                  <CardTitle>System Prompt</CardTitle>
                  <CardDescription>Define the AI's personality and instructions. This will be prepended to the user's prompt.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="system_prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="e.g. You are a witty assistant that speaks in pirate slang."
                          className="min-h-[120px] resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <TestTube2 className="h-6 w-6 text-accent" />
                <div>
                  <CardTitle>Sampling Parameters</CardTitle>
                  <CardDescription>Control the randomness and creativity of the output.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <SliderField control={form.control} name="temperature" label="Temperature" description="Higher values make output more random, lower values make it more deterministic." min={0} max={2} step={0.01} />
                <SliderField control={form.control} name="top_k" label="Top K" description="Limits sampling to the K most likely tokens." min={1} max={100} step={1} />
                <SliderField control={form.control} name="top_p" label="Top P" description="Samples from tokens with cumulative probability up to P." min={0} max={1} step={0.01} />
                <SliderField control={form.control} name="repeat_penalty" label="Repeat Penalty" description="Penalizes repeated tokens to encourage diversity." min={1} max={2} step={0.01} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <FileKey2 className="h-6 w-6 text-accent" />
                <div>
                  <CardTitle>Generation Control</CardTitle>
                  <CardDescription>Manage the length and stopping points of the response.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                 <FormField
                  control={form.control}
                  name="max_tokens"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Tokens</FormLabel>
                       <FormDescription>The maximum number of tokens to generate.</FormDescription>
                       <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stop"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stop Sequences</FormLabel>
                       <FormDescription>Sequences where the AI will stop generating. Separate with commas.</FormDescription>
                      <FormControl>
                        <Input
                          placeholder="e.g. <end_of_turn>, Human:"
                          value={Array.isArray(field.value) ? field.value.join(", ") : ""}
                          onChange={(e) => field.onChange(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-8">
              <Card>
                 <CardHeader className="flex flex-row items-center gap-4">
                  <Terminal className="h-6 w-6 text-accent" />
                  <div>
                    <CardTitle>API Request Preview</CardTitle>
                    <CardDescription>This is how your settings will look in an API call.</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={JSON.stringify(watchedValues)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CurlPreview config={watchedValues} apiUrl={apiUrl} />
                    </motion.div>
                  </AnimatePresence>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                    <CardTitle>Save Configuration</CardTitle>
                    <CardDescription>Persist your changes to be used in all future API requests.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button type="submit" className="w-full" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
