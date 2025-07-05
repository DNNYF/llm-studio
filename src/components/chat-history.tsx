"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types";
import { MessageSquarePlus, Trash2 } from "lucide-react";
import { useState } from "react";

interface ChatHistoryProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onCreateNewChat: () => void;
  onDeleteConversation: (id: string) => void;
}

export function ChatHistory({
  conversations,
  activeConversationId,
  onSelectConversation,
  onCreateNewChat,
  onDeleteConversation,
}: ChatHistoryProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="flex h-full flex-col">
      <div className="p-4">
        <Button className="w-full" onClick={onCreateNewChat}>
          <MessageSquarePlus className="mr-2 h-4 w-4" />
          Chat Baru
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-4 pt-0">
          {conversations.map((convo) => (
            <div
              key={convo.id}
              className="group relative flex items-center"
              onMouseEnter={() => setHoveredId(convo.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <Button
                variant={convo.id === activeConversationId ? "secondary" : "ghost"}
                className={cn(
                  "flex-1 justify-start h-10 pr-7 overflow-hidden rounded transition-all max-w-[200px] min-w-0"
                )}
                onClick={() => onSelectConversation(convo.id)}
              >
                <span
                  className={cn(
                    "block whitespace-nowrap",
                    "transition-all duration-700 ease-linear",
                    hoveredId === convo.id
                      ? "animate-marquee"
                      : "truncate"
                  )}
                  style={
                    hoveredId === convo.id
                      ? {
                          animation: "marquee-left 5s linear infinite",
                        }
                      : {}
                  }
                >
                  {convo.title}
                </span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                tabIndex={-1}
                className={cn(
                  "ml-[-2.25rem] z-10 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity",
                  "absolute right-2 top-1/2 -translate-y-1/2"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(convo.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete chat</span>
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
      {/* Custom marquee animation */}
      <style jsx global>{`
        @keyframes marquee-left {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .animate-marquee {
          will-change: transform;
          min-width: 100%;
        }
      `}</style>
    </div>
  );
}