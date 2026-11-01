import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { BarChart3, Sparkles, Star, ThumbsUp, History, ArrowRight, TrendingUp, Zap, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { CATEGORY_METADATA } from "@shared/schema";
import { format } from "date-fns";

interface UserStats {
  totalGenerations: number;
  thisWeek: number;
  favorites: number;
  thumbsUp: number;
  topCategories: { category: string; count: number }[];
  recentGenerations: {
    id: number;
    category: string;
    genType: string;
    createdAt: string;
    isFavorite: boolean;
    rating: number | null;
  }[];
}

export default function Dashboard() {
  const { isAuthenticated, user } = useAuth();

  const { data: stats, isLoading, isError, refetch } = useQuery<UserStats>({
    queryKey: ["/api/stats"],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="container mx-auto px-6 py-16 flex-1">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground" />
            <h1 className="text-4xl font-bold">Your Dashboard</h1>
            <p className="text-lg text-muted-foreground">Log in to see your usage stats and activity</p>
            <a href="/api/login">
              <Button size="lg">Log In</Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const getCategoryName = (id: string) => CATEGORY_METADATA.find(c => c.id === id)?.name ?? id;
  const getTypeLabel = (t: string) => t === "prompt_generator" ? "Prompt" : t === "agent_helper" ? "Agent" : "General";

  if (isError) {
    return (
      <div className="container mx-auto px-6 py-16 text-center space-y-4">
        <h1 className="text-3xl font-bold">Your Dashboard</h1>
        <p role="alert">Your statistics could not be loaded. This does not mean your saved activity is empty.</p>
        <Button variant="outline" onClick={() => refetch()}>Try again</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto px-6 py-8 flex-1">
        <div className="max-w-6xl mx-auto space-y-8">

          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold" data-testid="text-page-title">
              <BarChart3 className="inline-block h-10 w-10 mr-3 text-primary" />
              Dashboard
            </h1>
            <p className="text-lg text-muted-foreground">
              Welcome back{user?.firstName ? `, ${user.firstName}` : ""}. Here's your activity overview.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card data-testid="stat-total">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Total Generated
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold" data-testid="text-total-generations">{stats?.totalGenerations ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">all time</p>
              </CardContent>
            </Card>

            <Card data-testid="stat-week">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> This Week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold" data-testid="text-this-week">{stats?.thisWeek ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">last 7 days</p>
              </CardContent>
            </Card>

            <Card data-testid="stat-favorites">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Star className="h-4 w-4" /> Favorites
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold" data-testid="text-favorites">{stats?.favorites ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">saved prompts</p>
              </CardContent>
            </Card>

            <Card data-testid="stat-thumbsup">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4" /> Thumbs Up
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold" data-testid="text-thumbsup">{stats?.thumbsUp ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">rated prompts</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Top Categories
                </CardTitle>
                <CardDescription>Your most-used generator categories</CardDescription>
              </CardHeader>
              <CardContent>
                {!stats?.topCategories?.length ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No generations yet</p>
                    <Link href="/generators">
                      <Button variant="outline" size="sm" className="mt-4">Browse Generators</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stats.topCategories.map((item, i) => {
                      const max = stats.topCategories[0]?.count || 1;
                      const pct = Math.round((item.count / max) * 100);
                      return (
                        <div key={item.category} className="space-y-1" data-testid={`top-category-${i}`}>
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{getCategoryName(item.category)}</span>
                            <span className="text-muted-foreground">{item.count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Your latest generated prompts</CardDescription>
                </div>
                <Link href="/history">
                  <Button variant="ghost" size="sm" className="shrink-0">
                    View all <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {!stats?.recentGenerations?.length ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No generations yet</p>
                    <Link href="/playground">
                      <Button variant="outline" size="sm" className="mt-4">Open Playground</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stats.recentGenerations.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0" data-testid={`recent-${item.id}`}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{getCategoryName(item.category)}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(item.createdAt), "MMM d, h:mm a")}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge variant="outline" className="text-xs">{getTypeLabel(item.genType)}</Badge>
                          {item.isFavorite && <Star className="h-3 w-3 text-primary fill-primary" />}
                          {item.rating === 1 && <ThumbsUp className="h-3 w-3 text-green-500" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/playground">
              <Card className="hover-elevate cursor-pointer">
                <CardContent className="pt-6 text-center space-y-2">
                  <Sparkles className="h-8 w-8 mx-auto text-primary" />
                  <p className="font-semibold">Open Playground</p>
                  <p className="text-sm text-muted-foreground">Generate a new prompt</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/compare">
              <Card className="hover-elevate cursor-pointer">
                <CardContent className="pt-6 text-center space-y-2">
                  <BarChart3 className="h-8 w-8 mx-auto text-primary" />
                  <p className="font-semibold">Compare Generators</p>
                  <p className="text-sm text-muted-foreground">Run all 3 types side by side</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/community">
              <Card className="hover-elevate cursor-pointer">
                <CardContent className="pt-6 text-center space-y-2">
                  <TrendingUp className="h-8 w-8 mx-auto text-primary" />
                  <p className="font-semibold">Community Gallery</p>
                  <p className="text-sm text-muted-foreground">Browse public shared prompts</p>
                </CardContent>
              </Card>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
