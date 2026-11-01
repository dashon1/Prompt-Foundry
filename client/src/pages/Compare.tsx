import { useState } from "react";
import { useSearch } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, GitCompare, Copy, Check } from "lucide-react";
import { CATEGORY_METADATA, CATEGORIES, type Category, GENERATOR_TYPES, GENERATOR_SCHEMAS } from "@shared/schema";
import { DynamicForm } from "@/components/DynamicForm";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const TYPE_LABELS: Record<string, string> = {
  prompt_generator: "Prompt Generator",
  agent_helper: "Agent Helper",
  general_generator: "General Generator",
};

interface CompareResult {
  type: string;
  output: any;
  error?: string;
}

export default function Compare() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const categoryParam = params.get("category");
  const initialCategory: Category =
    categoryParam && (CATEGORIES as readonly string[]).includes(categoryParam)
      ? (categoryParam as Category)
      : "image";

  const [selectedCategory, setSelectedCategory] = useState<Category>(initialCategory);
  const [results, setResults] = useState<CompareResult[]>([]);
  const [currentInputs, setCurrentInputs] = useState<any>({});
  const [formKey, setFormKey] = useState(0);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const { toast } = useToast();

  const compareMutation = useMutation({
    mutationFn: async (inputs: any) => {
      const responses = await Promise.allSettled(
        GENERATOR_TYPES.map(type =>
          apiRequest("POST", `/api/generator/${selectedCategory}/${type}`, inputs)
            .then(res => ({ type, output: res.output }))
            .catch(err => ({ type, output: null, error: err.message || "Failed" }))
        )
      );
      return responses.map(r => r.status === "fulfilled" ? r.value : { type: "unknown", output: null, error: "Request failed" });
    },
    onSuccess: (data) => {
      setResults(data);
      toast({ title: "Done", description: "All 3 generator types completed" });
    },
    onError: () => {
      toast({ title: "Error", description: "Comparison failed", variant: "destructive" });
    }
  });

  const handleSubmit = (data: any) => {
    setCurrentInputs(data);
    compareMutation.mutate(data);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value as Category);
    setResults([]);
    setCurrentInputs({});
    setFormKey(k => k + 1);
  };

  const copyResult = (result: CompareResult) => {
    const text = getOutputText(result.output);
    navigator.clipboard.writeText(text);
    setCopiedType(result.type);
    setTimeout(() => setCopiedType(null), 2000);
    toast({ title: "Copied", description: "Result copied to clipboard" });
  };

  const getOutputText = (output: any): string => {
    if (!output) return "";
    const values = Object.values(output);
    const first = values[0];
    if (Array.isArray(first)) return first.join("\n\n");
    if (typeof first === "object") return JSON.stringify(first, null, 2);
    return String(first ?? "");
  };

  const renderOutput = (output: any) => {
    if (!output) return null;
    return Object.entries(output).map(([key, value]) => (
      <div key={key} className="space-y-1">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {key.replace(/_/g, " ")}
        </h4>
        <div className="bg-muted/50 rounded-md p-3">
          {Array.isArray(value) ? (
            <ul className="space-y-1">
              {(value as any[]).map((item, i) => (
                <li key={i} className="text-sm">{typeof item === "object" ? JSON.stringify(item) : String(item)}</li>
              ))}
            </ul>
          ) : typeof value === "object" ? (
            <pre className="text-xs whitespace-pre-wrap font-mono">{JSON.stringify(value, null, 2)}</pre>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{String(value)}</p>
          )}
        </div>
      </div>
    ));
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto px-6 py-8 flex-1">
        <div className="max-w-7xl mx-auto space-y-6">

          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold" data-testid="text-page-title">
              <GitCompare className="inline-block h-10 w-10 mr-3 text-primary" />
              Compare
            </h1>
            <p className="text-lg text-muted-foreground">
              Run all 3 generator types at once and compare the results side by side
            </p>
          </div>

          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Category</CardTitle>
                  <CardDescription>Choose what kind of prompt to compare</CardDescription>
                </div>
                <div className="w-full md:w-80">
                  <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                    <SelectTrigger data-testid="select-compare-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_METADATA.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Inputs</CardTitle>
                  <CardDescription>Fill once, compare across all types</CardDescription>
                </CardHeader>
                <CardContent>
                  <DynamicForm
                    key={`compare-${selectedCategory}-${formKey}`}
                    category={selectedCategory}
                    genType="prompt_generator"
                    onSubmit={handleSubmit}
                    isSubmitting={compareMutation.isPending}
                    initialValues={currentInputs}
                    submitLabel={compareMutation.isPending ? "Comparing..." : "Compare All 3"}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3">
              {compareMutation.isPending ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                  {GENERATOR_TYPES.map(type => (
                    <Card key={type} className="border-primary/20">
                      <CardHeader>
                        <CardTitle className="text-base">{TYPE_LABELS[type]}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-center py-20">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : results.length === 0 ? (
                <Card className="h-full">
                  <CardContent className="flex flex-col items-center justify-center py-32 text-center space-y-4">
                    <Sparkles className="h-12 w-12 text-muted-foreground" />
                    <p className="text-sm font-medium">Fill the form and click Compare All 3</p>
                    <p className="text-sm text-muted-foreground">
                      Results from Prompt Generator, Agent Helper, and General Generator will appear side by side
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {results.map(result => (
                    <Card key={result.type} className="border-accent/30 flex flex-col" data-testid={`result-${result.type}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <CardTitle className="text-base">{TYPE_LABELS[result.type]}</CardTitle>
                          {result.error ? (
                            <Badge variant="destructive">Failed</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">Done</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col gap-4">
                        {result.error ? (
                          <p className="text-sm text-destructive">{result.error}</p>
                        ) : (
                          <div className="space-y-3 flex-1">
                            {renderOutput(result.output)}
                          </div>
                        )}
                        {!result.error && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyResult(result)}
                            data-testid={`button-copy-${result.type}`}
                          >
                            {copiedType === result.type ? (
                              <Check className="h-3 w-3 mr-2" />
                            ) : (
                              <Copy className="h-3 w-3 mr-2" />
                            )}
                            Copy
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
