import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Share2, Copy, Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { CATEGORY_METADATA } from "@shared/schema";
import type { SharedLink } from "@shared/schema";
import { format } from "date-fns";
import { useRoute } from "wouter";

export default function SharedPrompt() {
  const [_, params] = useRoute("/share/:shareId");
  const shareId = params?.shareId || "";
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const { data: sharedLink, isLoading, error } = useQuery<SharedLink>({
    queryKey: ["/api/share", shareId],
    queryFn: async () => {
      const response = await fetch(`/api/share/${shareId}`);
      if (!response.ok) {
        throw new Error("Shared link not found");
      }
      return response.json();
    },
    enabled: !!shareId,
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied",
      description: "Prompt copied to clipboard",
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="container mx-auto px-6 py-16 flex-1">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !sharedLink) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="container mx-auto px-6 py-16 flex-1">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <Share2 className="h-16 w-16 mx-auto text-muted-foreground" />
            <h1 className="text-4xl font-bold">Shared Link Not Found</h1>
            <p className="text-lg text-muted-foreground">
              This shared link doesn't exist or has been removed
            </p>
            <a href="/playground">
              <Button size="lg" data-testid="button-go-to-playground">
                <Sparkles className="mr-2 h-4 w-4" />
                Go to Playground
              </Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  const categoryMeta = CATEGORY_METADATA.find((c) => c.id === sharedLink.category);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto px-6 py-8 flex-1">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Share2 className="h-10 w-10 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold" data-testid="text-page-title">
                Shared Prompt
              </h1>
            </div>
            <p className="text-lg text-muted-foreground" data-testid="text-page-description">
              View this shared prompt configuration
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{categoryMeta?.name || sharedLink.category}</Badge>
                    <Badge variant="outline">{sharedLink.genType.replace(/_/g, " ")}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Shared {format(new Date(sharedLink.createdAt), "MMM d, yyyy")} • {sharedLink.viewCount} views
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">Generated Prompt</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(String(sharedLink.output))}
                    data-testid="button-copy-output"
                  >
                    {copied ? (
                      <>
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <div className="rounded-md bg-muted p-4">
                  <p className="text-sm whitespace-pre-wrap font-mono">{String(sharedLink.output)}</p>
                </div>
              </div>

              {sharedLink.inputs && typeof sharedLink.inputs === 'object' && Object.keys(sharedLink.inputs as any).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Input Configuration</h3>
                  <div className="rounded-md bg-muted p-4">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(sharedLink.inputs, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <a href="/playground">
                  <Button data-testid="button-try-playground">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Try in Playground
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
