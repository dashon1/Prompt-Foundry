import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Key, Plus, Trash2, Copy, Check, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { ApiKey } from "@shared/schema";

export default function ApiKeys() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [newKeyName, setNewKeyName] = useState("");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data: response, isLoading, isError } = useQuery<{ keys: Omit<ApiKey, "keyHash">[] }>({
    queryKey: ["/api/keys"],
    enabled: isAuthenticated,
  });
  const data = response?.keys;

  const createMutation = useMutation({
    mutationFn: (name: string) => apiRequest("POST", "/api/keys", { name }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
      setRevealedKey(data.rawKey);
      setNewKeyName("");
      toast({ title: "API key created", description: "Copy your key now — it won't be shown again." });
    },
    onError: () => toast({ title: "Error", description: "Failed to create API key", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/keys/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
      toast({ title: "API key deleted" });
    },
    onError: () => toast({ title: "Error", description: "Failed to delete API key", variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/keys/${id}/toggle`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/keys"] }),
    onError: () => toast({ title: "Error", description: "Failed to update API key", variant: "destructive" }),
  });

  const copyKey = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Copied", description: "API key copied to clipboard" });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="container mx-auto px-6 py-16 text-center space-y-6">
          <Key className="h-16 w-16 mx-auto text-muted-foreground" />
          <h1 className="text-4xl font-bold">API Keys</h1>
          <p className="text-lg text-muted-foreground">Log in to manage your API keys</p>
          <a href="/api/login"><Button>Log In</Button></a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto px-6 py-8 flex-1">
        <div className="max-w-3xl mx-auto space-y-8">

          <div className="space-y-2">
            <h1 className="text-4xl font-bold" data-testid="text-page-title">
              <Key className="inline-block h-9 w-9 mr-3 text-primary" />
              API Keys
            </h1>
            <p className="text-muted-foreground">Create and manage API keys for programmatic access</p>
          </div>

          {revealedKey && (
            <Card className="border-green-500/30 bg-green-50/5">
              <CardHeader>
                <CardTitle className="text-sm text-green-600 dark:text-green-400">New API Key — copy it now</CardTitle>
                <CardDescription>This key will only be shown once and cannot be retrieved later.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono bg-muted p-3 rounded-md break-all">{revealedKey}</code>
                  <Button size="icon" variant="outline" onClick={() => copyKey(revealedKey, -1)} data-testid="button-copy-new-key">
                    {copiedId === -1 ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={() => setRevealedKey(null)}>Dismiss</Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Create New Key</CardTitle>
              <CardDescription>Give your key a descriptive name</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="My integration, Production app..."
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  maxLength={100}
                  onKeyDown={(e) => e.key === "Enter" && !createMutation.isPending && newKeyName.trim() && createMutation.mutate(newKeyName.trim())}
                  data-testid="input-key-name"
                />
                <Button
                  onClick={() => createMutation.mutate(newKeyName.trim())}
                  disabled={!newKeyName.trim() || createMutation.isPending}
                  data-testid="button-create-key"
                >
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Create
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Keys</CardTitle>
              <CardDescription>{data?.length ?? 0} key{data?.length !== 1 ? "s" : ""} total</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : isError ? (
                <p role="alert" className="text-center text-destructive py-8 text-sm">Could not load API keys. Your existing keys have not been changed. Please try again later.</p>
              ) : !data?.length ? (
                <p className="text-center text-muted-foreground py-8 text-sm">No API keys yet. Create one above.</p>
              ) : (
                <div className="space-y-3">
                  {data.map((key) => (
                    <div key={key.id} className="flex items-center justify-between gap-3 p-3 border border-border rounded-md" data-testid={`api-key-${key.id}`}>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{key.name}</p>
                          <Badge variant={key.isActive ? "secondary" : "outline"} className="shrink-0 text-xs">
                            {key.isActive ? "Active" : "Disabled"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">{key.keyPreview}</p>
                        <p className="text-xs text-muted-foreground">
                          Created {format(new Date(key.createdAt), "MMM d, yyyy")}
                          {key.lastUsedAt && ` · Last used ${format(new Date(key.lastUsedAt), "MMM d, yyyy")}`}
                          {" · "}{key.requestCount} request{key.requestCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleMutation.mutate(key.id)}
                          disabled={toggleMutation.isPending}
                          data-testid={`button-toggle-${key.id}`}
                        >
                          {key.isActive ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          {key.isActive ? "Disable" : "Enable"}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(key.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${key.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
