import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Users, Eye, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { CATEGORY_METADATA } from "@shared/schema";
import { format } from "date-fns";

interface CommunityEntry {
  shareId: string;
  category: string;
  genType: string;
  output: any;
  viewCount: number;
  createdAt: string;
}

export default function Community() {
  const { data, isLoading, isError, refetch } = useQuery<{ links: CommunityEntry[] }>({
    queryKey: ["/api/community"],
  });

  const links = data?.links ?? [];

  const getCategoryMeta = (id: string) => CATEGORY_METADATA.find(c => c.id === id);
  const getTypeLabel = (t: string) =>
    t === "prompt_generator" ? "Prompt" : t === "agent_helper" ? "Agent" : "General";

  const getOutputPreview = (output: any): string => {
    if (!output) return "No preview available";
    const values = Object.values(output);
    if (!values.length) return "No preview available";
    const first = values[0];
    if (Array.isArray(first)) return first.slice(0, 2).join(" · ");
    if (typeof first === "string") return first.slice(0, 180);
    if (typeof first === "object") return JSON.stringify(first).slice(0, 180);
    return String(first).slice(0, 180);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto px-6 py-8 flex-1">
        <div className="max-w-6xl mx-auto space-y-8">

          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold" data-testid="text-page-title">
              <Users className="inline-block h-10 w-10 mr-3 text-primary" />
              Community Gallery
            </h1>
            <p className="text-lg text-muted-foreground" data-testid="text-page-description">
              Browse prompts shared by the community. Click any to view the full result.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <Card>
              <CardContent className="py-12 text-center space-y-4">
                <p role="alert">Community prompts could not be loaded. Please try again when the service is available.</p>
                <Button variant="outline" onClick={() => refetch()}>Try again</Button>
              </CardContent>
            </Card>
          ) : links.length === 0 ? (
            <Card>
              <CardContent className="py-20 text-center space-y-4">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-lg font-medium">No shared prompts yet</p>
                <p className="text-muted-foreground text-sm">
                  Be the first! Generate a prompt in the Playground and click Share.
                </p>
                <Link href="/playground">
                  <Button>Open Playground</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {links.map((link) => {
                const meta = getCategoryMeta(link.category);
                return (
                  <Card key={link.shareId} className="hover-elevate flex flex-col" data-testid={`community-card-${link.shareId}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">{meta?.name ?? link.category}</Badge>
                          <Badge variant="outline">{getTypeLabel(link.genType)}</Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                          <Eye className="h-3 w-3" />
                          {link.viewCount}
                        </div>
                      </div>
                      <CardDescription className="text-xs pt-1">
                        {format(new Date(link.createdAt), "MMM d, yyyy")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-4">
                      <div className="bg-muted/50 rounded-md p-3 flex-1">
                        <p className="text-sm leading-relaxed line-clamp-5 text-foreground/80">
                          {getOutputPreview(link.output)}
                        </p>
                      </div>
                      <Link href={`/share/${link.shareId}`}>
                        <Button variant="outline" size="sm" className="w-full" data-testid={`button-view-${link.shareId}`}>
                          <ExternalLink className="h-3 w-3 mr-2" />
                          View Full Prompt
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
