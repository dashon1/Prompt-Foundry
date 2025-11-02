import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Loader2, Star, Trash2, Search, History as HistoryIcon, Copy, Check } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { CATEGORY_METADATA } from "@shared/schema";
import type { GenerationHistory, Category } from "@shared/schema";
import { format } from "date-fns";

export default function History() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [deleteHistoryId, setDeleteHistoryId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const { data: historyData, isLoading } = useQuery<{ history: GenerationHistory[] }>({
    queryKey: ["/api/history"],
    enabled: isAuthenticated,
  });

  const history = historyData?.history || [];

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (historyId: number) => {
      return apiRequest("PATCH", `/api/history/${historyId}/favorite`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/history"] });
    },
  });

  const deleteHistoryMutation = useMutation({
    mutationFn: async (historyId: number) => {
      return apiRequest("DELETE", `/api/history/${historyId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/history"] });
      setDeleteHistoryId(null);
      toast({
        title: "History deleted",
        description: "History item has been deleted",
      });
    },
  });

  const handleCopy = (output: unknown, id: number) => {
    navigator.clipboard.writeText(String(output));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "Copied",
      description: "Prompt copied to clipboard",
    });
  };

  const filteredHistory = history.filter((item) => {
    const matchesSearch = searchQuery === "" || 
      String(item.output).toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(item.inputs).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const favoriteHistory = filteredHistory.filter((h) => h.isFavorite);
  const otherHistory = filteredHistory.filter((h) => !h.isFavorite);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="container mx-auto px-6 py-16 flex-1">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <HistoryIcon className="h-16 w-16 mx-auto text-muted-foreground" />
            <h1 className="text-4xl font-bold">Generation History</h1>
            <p className="text-lg text-muted-foreground">
              Log in to view your generation history
            </p>
            <a href="/api/login">
              <Button size="lg" data-testid="button-login-history">
                Log In
              </Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto px-6 py-8 flex-1">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold" data-testid="text-page-title">
              <HistoryIcon className="inline-block h-10 w-10 mr-3 text-primary" />
              History
            </h1>
            <p className="text-lg text-muted-foreground" data-testid="text-page-description">
              View and manage your generation history
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Search and filter your history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search history..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-history"
                    />
                  </div>
                </div>
                <div className="w-full md:w-64">
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger data-testid="select-filter-category">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {CATEGORY_METADATA.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredHistory.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <p className="text-muted-foreground">
                  {searchQuery || filterCategory !== "all" 
                    ? "No history items match your filters"
                    : "No generation history yet. Generate your first prompt!"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {favoriteHistory.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Favorites</h2>
                  {favoriteHistory.map((item) => (
                    <HistoryItem
                      key={item.id}
                      item={item}
                      onToggleFavorite={toggleFavoriteMutation.mutate}
                      onDelete={setDeleteHistoryId}
                      onCopy={handleCopy}
                      copiedId={copiedId}
                    />
                  ))}
                </div>
              )}
              {otherHistory.length > 0 && (
                <div className="space-y-4">
                  {favoriteHistory.length > 0 && (
                    <h2 className="text-xl font-semibold">All History</h2>
                  )}
                  {otherHistory.map((item) => (
                    <HistoryItem
                      key={item.id}
                      item={item}
                      onToggleFavorite={toggleFavoriteMutation.mutate}
                      onDelete={setDeleteHistoryId}
                      onCopy={handleCopy}
                      copiedId={copiedId}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={deleteHistoryId !== null} onOpenChange={() => setDeleteHistoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete history item?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This history item will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteHistoryId && deleteHistoryMutation.mutate(deleteHistoryId)}
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface HistoryItemProps {
  item: GenerationHistory;
  onToggleFavorite: (id: number) => void;
  onDelete: (id: number) => void;
  onCopy: (output: unknown, id: number) => void;
  copiedId: number | null;
}

function HistoryItem({ item, onToggleFavorite, onDelete, onCopy, copiedId }: HistoryItemProps) {
  const categoryMeta = CATEGORY_METADATA.find((c) => c.id === item.category);

  return (
    <Card data-testid={`history-${item.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{categoryMeta?.name || item.category}</Badge>
              <Badge variant="outline">{item.genType.replace(/_/g, " ")}</Badge>
              {item.isFavorite && (
                <Badge variant="default" className="gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  Favorite
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {format(new Date(item.createdAt), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onToggleFavorite(item.id)}
              data-testid={`button-favorite-${item.id}`}
            >
              <Star className={`h-4 w-4 ${item.isFavorite ? "fill-primary text-primary" : ""}`} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onCopy(item.output, item.id)}
              data-testid={`button-copy-${item.id}`}
            >
              {copiedId === item.id ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDelete(item.id)}
              data-testid={`button-delete-${item.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Generated Prompt</h3>
            <div className="rounded-md bg-muted p-4">
              <p className="text-sm whitespace-pre-wrap font-mono">{String(item.output)}</p>
            </div>
          </div>
          {item.inputs && typeof item.inputs === 'object' && Object.keys(item.inputs as any).length > 0 ? (
            <div>
              <h3 className="text-sm font-medium mb-2">Inputs</h3>
              <div className="rounded-md bg-muted p-4">
                <pre className="text-xs overflow-x-auto">
                  {JSON.stringify(item.inputs, null, 2)}
                </pre>
              </div>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
