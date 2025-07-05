"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User, Loader2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/types";

// Tambahkan import react-markdown dan plugin markdown
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
}

export function ChatInterface({ messages, onSendMessage, isLoading }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const currentInput = input;
    setInput("");
    await onSendMessage(currentInput);
  };

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1 p-4 pr-8">
        {messages.length > 0 ? (
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-4",
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback>
                    {message.role === "user" ? (
                      <User className="h-5 w-5" />
                    ) : (
                      <Bot className="h-5 w-5" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    "rounded-lg px-4 py-3 max-w-[80%] shadow-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card"
                  )}
                >
                  {/* Ganti ini: */}
                  {/* <p className="text-sm leading-relaxed">{message.content}</p> */}

                  {/* Jadi ini: */}
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    linkTarget="_blank"
                    components={{
                      // Optionally customize how certain HTML or markdown rendered
                      // For example, force line breaks on single \n as well:
                      p: ({node, ...props}) => <p className="text-sm leading-relaxed" {...props} />,
                      li: ({node, ...props}) => <li className="ml-4 list-disc" {...props} />,
                    }}
                  >
                    {message.content
                      // Pastikan \n diganti jadi double space + \n biar markdown treat as <br>
                      .replace(/\\n/g, '\n') // Kalau API kadang kirim literal "\n"
                    }
                  </ReactMarkdown>
                </div>
              </div>
            ))}
             {isLoading && (
              <div className="flex items-start gap-4 flex-row">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-lg px-4 py-3 max-w-[80%] shadow-sm bg-card flex items-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <MessageSquare className="h-16 w-16 text-muted-foreground/50" />
            <h2 className="mt-4 text-2xl font-semibold">Mulai percakapan baru</h2>
            <p className="mt-2 text-muted-foreground">
              Riwayat obrolan Anda akan disimpan di sidebar.
            </p>
          </div>
        )}
      </ScrollArea>
      <div className="border-t bg-background p-4">
        <form
          onSubmit={handleSubmit}
          className="flex w-full items-center space-x-2"
        >
          <Input
            id="message"
            placeholder="Ketik pesan Anda..."
            className="flex-1"
            autoComplete="off"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}