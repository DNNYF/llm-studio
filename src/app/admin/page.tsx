
import { LlmConfigForm } from "@/components/llm-config-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, BotMessageSquare, TestTube2, FileKey2, Terminal, MessageSquare, LogOut, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getActiveLlmConfig, logout } from "./actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export default async function AdminPage() {
  const activeConfig = await getActiveLlmConfig();
  const apiUrl = process.env.HEROKU_API_URL || 'https://your-custom-api-url.com/v1/chat/completions';

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <div className="container mx-auto p-4 py-8 md:p-8">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Settings className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-headline text-foreground">
                LLM Config Manager
              </h1>
              <p className="text-muted-foreground">
                An admin dashboard to configure inference request parameters for your LLM.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/chat" passHref>
                <Button variant="outline">
                <MessageSquare className="mr-2 h-4 w-4" />
                Buka Chat Pengguna
                </Button>
            </Link>
            <form action={logout}>
                <Button variant="ghost">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </form>
          </div>
        </header>
        
        {activeConfig ? (
            <LlmConfigForm initialConfig={activeConfig} apiUrl={apiUrl} />
        ) : (
             <Card>
                <CardHeader>
                <CardTitle>Error</CardTitle>
                </CardHeader>
                <CardContent>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Active Configuration Found</AlertTitle>
                    <AlertDescription>
                    Could not find an active LLM configuration in the database. Please ensure at least one configuration has `is_active` set to `true`.
                    </AlertDescription>
                </Alert>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
