import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { detectJSONType, analyzeN8nWorkflow, type N8nWorkflow } from "@/lib/jsonAnalyzer";
import { apiRequest } from "@/lib/queryClient";
import type { Category, GeneratorType } from "@shared/schema";

interface JSONImportExportProps {
  currentCategory: Category;
  currentType: GeneratorType;
  currentInputs: any;
  onImportPromptConfig: (category: Category, genType: GeneratorType, inputs: any) => void;
  onImportN8nWorkflow: (workflow: N8nWorkflow) => void;
}

export function JSONImportExport({
  currentCategory,
  currentType,
  currentInputs,
  onImportPromptConfig,
  onImportN8nWorkflow,
}: JSONImportExportProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.json')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JSON file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 200000) {
      toast({
        title: "File too large",
        description: "Maximum file size is 200KB",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);

      const detection = detectJSONType(jsonData);

      if (detection.type === "n8n_workflow") {
        const analysis = analyzeN8nWorkflow(detection.workflow);
        
        toast({
          title: "n8n Workflow detected",
          description: `Found ${analysis.nodeCount} nodes. Converting to automation prompt...`,
        });

        onImportN8nWorkflow(detection.workflow);
      } else if (detection.type === "prompt_config") {
        toast({
          title: "Prompt configuration loaded",
          description: `Loaded ${detection.category} / ${detection.genType}`,
        });

        onImportPromptConfig(detection.category, detection.genType, detection.inputs);
      } else {
        toast({
          title: "Unknown JSON format",
          description: detection.error || "Could not determine file type",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error parsing JSON",
        description: error.message || "Invalid JSON file",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = () => {
    const exportData = {
      category: currentCategory,
      genType: currentType,
      inputs: currentInputs,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const date = `${year}${month}${day}`;
    const filename = `prompt-foundry-${currentCategory}-${date}.json`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Configuration exported",
      description: `Downloaded as ${filename}`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import & Export</CardTitle>
        <CardDescription>Upload JSON files or export current configuration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          data-testid="dropzone-json-upload"
        >
          {isProcessing ? (
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Processing JSON...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-3">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Drop JSON file here</p>
                <p className="text-xs text-muted-foreground">
                  Supports prompt configs & n8n workflows
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileInputChange}
                className="hidden"
                data-testid="input-file-upload"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                data-testid="button-browse-json"
              >
                <Upload className="h-4 w-4 mr-2" />
                Browse Files
              </Button>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleDownload}
            variant="outline"
            className="flex-1"
            disabled={!currentInputs || Object.keys(currentInputs).length === 0}
            data-testid="button-download-json"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
