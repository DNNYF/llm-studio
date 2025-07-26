"use client";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { MessageSquarePlus } from "lucide-react";

interface ChatHeaderProps {
  title?: string;
  onNewChat: () => void;
}

export function ChatHeader({ title = "Chat", onNewChat }: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:h-[60px] lg:px-6">
      <SidebarTrigger />
      <div className="flex-1">
        <h1 className="text-lg font-semibold md:text-xl truncate">
          {title}
        </h1>
      </div>
      <Button 
        variant="outline" 
        size="sm"
        onClick={onNewChat}
        className="gap-2"
      >
        <MessageSquarePlus className="h-4 w-4" />
        New Chat
      </Button>
    </header>
  );
}