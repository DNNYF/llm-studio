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
  // Track hovered item for marquee effect
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
              className="group relative"
              onMouseEnter={() => setHoveredId(convo.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <Button
                variant={convo.id === activeConversationId ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start h-10 pr-8 overflow-hidden rounded transition-all",
                  // fix: ensure fixed width and hide overflow, no text overflow
                  "max-w-[200px] min-w-0"
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
                  // Custom style for smooth marquee
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
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100"
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
          /* The min-width is for smoothness, you can adjust */
          min-width: 100%;
        }
      `}</style>
    </div>
  );
}