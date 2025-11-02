import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download, FileText, Loader2, Sparkles, Share2, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { Category, GeneratorType } from "@shared/schema";

interface ResultPanelProps {
  result: any;
  isLoading: boolean;
  category: Category;
  genType: GeneratorType;
  inputs?: any;
}

export function ResultPanel({ result, isLoading, category, genType, inputs }: ResultPanelProps) {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [sharedUrl, setSharedUrl] = useState<string | null>(null);

  const shareMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/shares", {
        category,
        genType,
        inputs: inputs || {},
        output: result.output,
      });
    },
    onSuccess: (data: any) => {
      const url = `${window.location.origin}/share/${data.shareId}`;
      setSharedUrl(url);
      navigator.clipboard.writeText(url);
      toast({
        title: "Share link created",
        description: "Link copied to clipboard",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create share link",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Result copied to clipboard"
    });
  };

  const handleShare = () => {
    if (sharedUrl) {
      navigator.clipboard.writeText(sharedUrl);
      toast({
        title: "Copied",
        description: "Share link copied to clipboard",
      });
    } else {
      shareMutation.mutate();
    }
  };

  const downloadJSON = () => {
    // Create a complete export object with all relevant data
    const exportData = {
      category,
      generatorType: genType,
      generatedAt: result?.metadata?.timestamp || new Date().toISOString(),
      output: result?.output || result,
      inputs: inputs || {},
      metadata: result?.metadata || {}
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${category}-${genType}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Downloaded",
      description: "Result saved as JSON"
    });
  };

  const exportMarkdown = () => {
    let markdown = `# ${category} - ${genType}\n\n`;
    markdown += `Generated: ${new Date().toLocaleString()}\n\n`;
    markdown += `## Output\n\n`;
    
    const outputData = result?.output || result;
    if (outputData && typeof outputData === 'object') {
      Object.entries(outputData).forEach(([key, value]) => {
        markdown += `### ${key}\n\n`;
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            markdown += `${index + 1}. ${item}\n`;
          });
        } else if (typeof value === "object" && value !== null) {
          markdown += "```json\n" + JSON.stringify(value, null, 2) + "\n```\n";
        } else {
          markdown += `${value}\n`;
        }
        markdown += "\n";
      });
    } else if (outputData) {
      // If output is a string or other primitive
      markdown += `${String(outputData)}\n\n`;
    }
    
    // Add inputs if available
    if (inputs && Object.keys(inputs).length > 0) {
      markdown += `## Inputs\n\n`;
      markdown += "```json\n" + JSON.stringify(inputs, null, 2) + "\n```\n";
    }

    const dataBlob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${category}-${genType}-${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Exported",
      description: "Result saved as Markdown"
    });
  };

  const renderOutput = (output: any) => {
    if (!output) return null;

    return Object.entries(output).map(([key, value]) => {
      if (Array.isArray(value)) {
        return (
          <div key={key} className="space-y-2">
            <h4 className="text-sm font-semibold capitalize text-muted-foreground">{key.replace(/_/g, " ")}</h4>
            <div className="space-y-2">
              {value.map((item, index) => (
                <div key={index} className="bg-muted/50 rounded-md p-3 text-sm" data-testid={`text-output-${key}-${index}`}>
                  {typeof item === "object" ? (
                    <pre className="whitespace-pre-wrap font-mono text-xs">{JSON.stringify(item, null, 2)}</pre>
                  ) : (
                    <p>{item}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }

      if (typeof value === "object") {
        return (
          <div key={key} className="space-y-2">
            <h4 className="text-sm font-semibold capitalize text-muted-foreground">{key.replace(/_/g, " ")}</h4>
            <div className="bg-muted/50 rounded-md p-3">
              <pre className="whitespace-pre-wrap font-mono text-xs" data-testid={`text-output-${key}`}>
                {JSON.stringify(value, null, 2)}
              </pre>
            </div>
          </div>
        );
      }

      return (
        <div key={key} className="space-y-2">
          <h4 className="text-sm font-semibold capitalize text-muted-foreground">{key.replace(/_/g, " ")}</h4>
          <div className="bg-muted/50 rounded-md p-4">
            <p className="text-sm leading-relaxed whitespace-pre-wrap" data-testid={`text-output-${key}`}>{String(value)}</p>
          </div>
        </div>
      );
    });
  };

  if (isLoading) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Generating...</CardTitle>
          <CardDescription>Please wait while we generate your prompt</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" data-testid="loader-generating" />
            <p className="text-sm text-muted-foreground">Processing your request</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Result</CardTitle>
          <CardDescription>Your generated prompt will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground" />
            <div className="space-y-2">
              <p className="text-sm font-medium" data-testid="text-empty-state">
                No result yet
              </p>
              <p className="text-sm text-muted-foreground">
                Fill in the form and click Generate to see your prompt
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getOutputText = () => {
    if (!result?.output) return "";
    const firstValue = Object.values(result.output)[0];
    if (Array.isArray(firstValue)) {
      return firstValue.join("\n\n");
    }
    if (typeof firstValue === "object") {
      return JSON.stringify(firstValue, null, 2);
    }
    return String(firstValue);
  };

  return (
    <Card className="border-accent/30">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              Result
            </CardTitle>
            <CardDescription>Generated prompt ready to use</CardDescription>
          </div>
          <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20" data-testid="badge-success">
            Success
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {result.output && renderOutput(result.output)}
        </div>

        <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(getOutputText())}
            className="flex-1 min-w-[120px]"
            data-testid="button-copy"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          {isAuthenticated && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              disabled={shareMutation.isPending}
              className="flex-1 min-w-[120px]"
              data-testid="button-share"
            >
              {shareMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : sharedUrl ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Share2 className="h-4 w-4 mr-2" />
              )}
              {sharedUrl ? "Copied" : "Share"}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={downloadJSON}
            className="flex-1 min-w-[120px]"
            data-testid="button-download-json"
          >
            <Download className="h-4 w-4 mr-2" />
            JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportMarkdown}
            className="flex-1 min-w-[120px]"
            data-testid="button-export-markdown"
          >
            <FileText className="h-4 w-4 mr-2" />
            Markdown
          </Button>
        </div>

        {result.metadata && (
          <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t border-border" data-testid="text-metadata">
            <p>Category: {result.metadata.category}</p>
            <p>Type: {result.metadata.genType}</p>
            <p>Generated: {new Date(result.metadata.timestamp).toLocaleString()}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
