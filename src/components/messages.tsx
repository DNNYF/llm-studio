"use client";

import { useRef, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, Loader2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/types";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

/**
 * Auto-fix AI generated list points.
 * - Replace "1..", "2 ..", "3 ..", etc with "1.", "2.", dst untuk markdown list.
 */
function fixListPoints(text: string): string {
  // Ganti 1.. atau 1 .. atau 1 . . jadi 1.
  // Hanya di awal baris (atau setelah \n)
  return text.replace(
    /^(\s*)(\d+)\s*\.\.\s*/gm, // 1.. atau 1 .. di awal baris
    "$1$2. "
  ).replace(
    /^(\s*)(\d+)\s*\.\s*\.\s*/gm, // 1 . . di awal baris
    "$1$2. "
  );
}

interface MessagesProps {
  messages: Message[];
  isLoading: boolean;
}

export function Messages({ messages, isLoading }: MessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center px-4">
        <MessageSquare className="h-16 w-16 text-muted-foreground/50" />
        <h2 className="mt-4 text-2xl font-semibold">Mulai percakapan baru</h2>
        <p className="mt-2 text-muted-foreground">
          Riwayat obrolan Anda akan disimpan di sidebar.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="max-w-4xl mx-auto px-4 py-6">
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
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    img: () => null, // Disable rendering <img> tags
                    br: () => <br />,
                    p: ({node, ...props}) => <p className="text-sm leading-relaxed" {...props} />,
                    li: ({node, ...props}) => <li className="ml-4 list-disc" {...props} />,
                    a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" />,
                  }}
                >
                  {
                    // 1. Normalisasi \n
                    // 2. Fix point list AI (ganti 1.. jadi 1.)
                    fixListPoints(
                      message.content.replace(/\\n/g, '\n')
                    )
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
      </div>
    </ScrollArea>
  );
}