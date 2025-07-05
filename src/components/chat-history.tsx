"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types";
import { MessageSquarePlus, Trash2 } from "lucide-react";

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
            <div key={convo.id} className="group relative">
                <Button
                variant={convo.id === activeConversationId ? "secondary" : "ghost"}
                className="w-full justify-start truncate h-10 pr-8"
                onClick={() => onSelectConversation(convo.id)}
                >
                {convo.title}
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
    </div>
  );
}
