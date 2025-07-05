"use client";

import { useState, useEffect, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { chat } from "@/ai/flows/chat";
import { ChatInterface } from "@/components/chat-interface";
import { ChatHistory } from "@/components/chat-history";
import type { Conversation, Message } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

const LS_CHAT_KEY = "chatHistory";

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);

  useEffect(() => {
    try {
      const savedHistoryRaw = localStorage.getItem(LS_CHAT_KEY);
      if (savedHistoryRaw) {
        const savedHistory = JSON.parse(savedHistoryRaw);
        if (savedHistory.conversations && Array.isArray(savedHistory.conversations) && savedHistory.conversations.length > 0) {
          setConversations(savedHistory.conversations);

          const activeIdIsValid = savedHistory.conversations.some((c: Conversation) => c.id === savedHistory.activeConversationId);

          if (activeIdIsValid) {
            setActiveConversationId(savedHistory.activeConversationId);
          } else {
            setActiveConversationId(savedHistory.conversations[0].id);
          }
        }
      }
    } catch (e) {
      console.error("Failed to parse chat history from localStorage", e);
    }
  }, []);

  useEffect(() => {
    if (conversations.length > 0 && activeConversationId) {
      const dataToSave = {
        conversations,
        activeConversationId,
      };
      localStorage.setItem(LS_CHAT_KEY, JSON.stringify(dataToSave));
    } else if (conversations.length === 0) {
      localStorage.removeItem(LS_CHAT_KEY);
    }
  }, [conversations, activeConversationId]);

  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConversationId) || null;
  }, [conversations, activeConversationId]);

  const handleCreateNewChat = () => {
    const newId = uuidv4();
    const newConversation: Conversation = {
      id: newId,
      title: "New Chat",
      messages: [{ role: "assistant", content: "Hello! How can I help you today?" }],
    };
    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversationId(newId);
  };

  const handleDeleteConversation = (id: string) => {
    const updatedConversations = conversations.filter(c => c.id !== id);
    setConversations(updatedConversations);

    if (activeConversationId === id) {
      setActiveConversationId(updatedConversations.length > 0 ? updatedConversations[0].id : null);
    }
    setConversationToDelete(null);
  };

  const handleClearAllHistory = () => {
    setConversations([]);
    setActiveConversationId(null);
    localStorage.removeItem(LS_CHAT_KEY);
    setShowClearAllDialog(false);
  };

  const makeChatTitle = (userMsg: string, aiMsg?: string) => {
    // Ambil 40 karakter pertama dari userMsg, atau jika ada aiMsg bisa diutamakan.
    if (aiMsg && aiMsg.trim()) {
      // Ambil kalimat pertama jawaban AI (atau 40 char)
      const firstLine = aiMsg.split(/[\n.?!]/)[0].trim();
      return firstLine.length > 0 ? firstLine.slice(0, 40) : aiMsg.slice(0, 40);
    }
    return userMsg.slice(0, 40) + (userMsg.length > 40 ? "..." : "");
  };

  const handleSendMessage = async (messageContent: string) => {
    let currentConversationId = activeConversationId;
    let newConversationCreated = false;
    let currentConversationMessages: Message[] = [];

    const userMessage: Message = { role: 'user', content: messageContent };

    setIsLoading(true);

    if (!currentConversationId) {
      // Buat chat baru jika belum ada
      const newId = uuidv4();
      const newConversation: Conversation = {
        id: newId,
        title: "New Chat",
        messages: [userMessage],
      };
      setConversations(prev => [newConversation, ...prev]);
      setActiveConversationId(newId);
      currentConversationId = newId;
      newConversationCreated = true;
      currentConversationMessages = [userMessage];
    } else {
      setConversations(prev =>
        prev.map(c => {
          if (c.id === currentConversationId) {
            const updatedMessages = [...c.messages, userMessage];
            currentConversationMessages = updatedMessages;
            return { ...c, messages: updatedMessages };
          }
          return c;
        })
      );
    }

    try {
      // For the AI call, we need the history *before* the new user message was added.
      const historyForAI = newConversationCreated
        ? []
        : currentConversationMessages.slice(0, -1);

      const response = await chat({
        history: historyForAI,
        message: messageContent,
      });

      const assistantMessage: Message = { role: 'assistant', content: response };

      setConversations(prev =>
        prev.map(c => {
          if (c.id === currentConversationId) {
            let newTitle = c.title;
            // Jika judul masih "New Chat", update dengan isi pertanyaan user atau jawaban AI
            if (c.title === "New Chat") {
              newTitle = makeChatTitle(messageContent, response);
            }
            return { ...c, title: newTitle, messages: [...c.messages, assistantMessage] };
          }
          return c;
        })
      );
    } catch (error) {
      console.error('Error calling chat flow:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Sorry, I ran into an error. Please try again.',
      };
      setConversations(prev =>
        prev.map(c =>
          c.id === currentConversationId
            ? { ...c, messages: [...c.messages, errorMessage] }
            : c
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background">
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center justify-between p-2 pt-4">
              <h2 className="px-2 text-lg font-semibold tracking-tight">Chat History</h2>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-0">
            <ChatHistory
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelectConversation={setActiveConversationId}
              onCreateNewChat={handleCreateNewChat}
              onDeleteConversation={(id) => setConversationToDelete(id)}
            />
          </SidebarContent>
          <SidebarFooter>
            <div className="p-2 border-t">
                <Button variant="ghost" className="w-full justify-start" onClick={() => setShowClearAllDialog(true)}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Hapus Semua Histori</span>
                </Button>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
            <SidebarTrigger />
            <div className="flex-1">
              <h1 className="text-lg font-semibold md:text-xl truncate">
                {activeConversation?.title || "Chat"}
              </h1>
            </div>
          </header>
          <main className="flex-1 overflow-hidden">
            <ChatInterface
              messages={activeConversation?.messages || []}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          </main>
        </SidebarInset>
      </SidebarProvider>
      <AlertDialog open={!!conversationToDelete} onOpenChange={(open) => !open && setConversationToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete this chat history. This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConversationToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                    if (conversationToDelete) {
                        handleDeleteConversation(conversationToDelete);
                    }
                }}>
                  Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Yakin ingin menghapus semua histori?</AlertDialogTitle>
                <AlertDialogDescription>
                    Tindakan ini akan menghapus semua histori percakapan secara permanen. Tindakan ini tidak dapat dibatalkan.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowClearAllDialog(false)}>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAllHistory}>
                  Hapus Semua
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}