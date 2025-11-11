import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles } from "lucide-react";
import { CATEGORY_METADATA, type Category, type GeneratorType, GENERATOR_TYPES, type Preset, GENERATOR_SCHEMAS } from "@shared/schema";
import { DynamicForm } from "@/components/DynamicForm";
import { ResultPanel } from "@/components/ResultPanel";
import { PresetManager } from "@/components/PresetManager";
import { JSONImportExport } from "@/components/JSONImportExport";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { N8nWorkflow } from "@/lib/jsonAnalyzer";

export default function Playground() {
  const [selectedCategory, setSelectedCategory] = useState<Category>("image");
  const [selectedType, setSelectedType] = useState<GeneratorType>("prompt_generator");
  const [result, setResult] = useState<any>(null);
  const [currentInputs, setCurrentInputs] = useState<any>({});
  const [lastWorkflow, setLastWorkflow] = useState<any | null>(null);
  const formResetKeyRef = useRef(0);
  const { toast } = useToast();

  const generateMutation = useMutation({
    mutationFn: async (inputs: any) => {
      const response = await apiRequest(
        "POST",
        `/api/generator/${selectedCategory}/${selectedType}`,
        inputs
      );
      return response;
    },
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: "Success",
        description: "Prompt generated successfully"
      });
    },
    onError: (error: any) => {
      // Show detailed validation errors if available
      let description = error.message || "Failed to generate prompt";
      
      if (error.details && Array.isArray(error.details)) {
        const errorMessages = error.details
          .map((err: any) => `${err.path.join('.')}: ${err.message}`)
          .slice(0, 3)
          .join('; ');
        description = errorMessages || description;
      }
      
      toast({
        title: "Error",
        description,
        variant: "destructive"
      });
    }
  });

  const aiAssistMutation = useMutation({
    mutationFn: async () => {
      const schema = GENERATOR_SCHEMAS[selectedCategory]?.[selectedType];
      if (!schema) throw new Error("Schema not found");

      const schemaShape = schema.shape;
      const emptyFields: string[] = [];

      for (const [key, fieldSchema] of Object.entries(schemaShape)) {
        const isOptional = (fieldSchema as any)._def?.typeName === "ZodOptional";
        const hasDefault = (fieldSchema as any)._def?.defaultValue !== undefined;
        
        const value = currentInputs[key];
        const isTrulyEmpty = 
          value === undefined ||
          value === null ||
          value === "" ||
          (Array.isArray(value) && value.length === 0);

        if (!isOptional && !hasDefault && isTrulyEmpty) {
          emptyFields.push(key);
        }
      }

      if (emptyFields.length === 0) {
        throw new Error("No empty fields to assist with");
      }

      const response = await apiRequest("POST", "/api/ai-assist", {
        category: selectedCategory,
        genType: selectedType,
        currentInputs,
        emptyFields,
        workflowContext: lastWorkflow
      });

      return response;
    },
    onSuccess: (data) => {
      if (data.suggestions) {
        setCurrentInputs(prev => ({ ...prev, ...data.suggestions }));
        formResetKeyRef.current += 1;
        toast({
          title: "AI Assist Complete",
          description: `Filled ${Object.keys(data.suggestions).length} field(s) with intelligent suggestions`
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "AI Assist Failed",
        description: error.message || "Failed to generate suggestions",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (data: any) => {
    setCurrentInputs(data);
    generateMutation.mutate(data);
  };

  const handleLoadPreset = (preset: Preset) => {
    setSelectedCategory(preset.category as Category);
    setSelectedType(preset.genType as GeneratorType);
    setCurrentInputs(preset.inputs);
    formResetKeyRef.current += 1;
    toast({
      title: "Preset loaded",
      description: `Loaded preset: ${preset.name}`,
    });
  };

  const handleImportPromptConfig = (category: Category, genType: GeneratorType, inputs: any) => {
    setSelectedCategory(category);
    setSelectedType(genType);
    setCurrentInputs(inputs);
    formResetKeyRef.current += 1;
  };

  const handleImportN8nWorkflow = async (workflow: N8nWorkflow) => {
    try {
      setLastWorkflow(workflow);
      const response = await apiRequest("POST", "/api/workflows/analyze", { workflow });
      
      setSelectedCategory(response.suggestedCategory || "automation_augmentation");
      setSelectedType("prompt_generator");
      setCurrentInputs(response.extractedInputs || {});
      formResetKeyRef.current += 1;

      let savedToLibrary = false;
      try {
        await apiRequest("POST", "/api/workflows", {
          name: workflow.name || "Imported Workflow",
          description: `${response.workflowType} with ${response.nodeCount} nodes`,
          workflowData: workflow,
          workflowType: response.workflowType,
          nodesUsed: response.nodesUsed,
          tags: []
        });
        savedToLibrary = true;
      } catch (saveError: any) {
        console.error("Failed to save workflow to library:", saveError);
      }

      toast({
        title: savedToLibrary ? "n8n workflow converted" : "Workflow analyzed (not saved)",
        description: savedToLibrary 
          ? `Analyzed ${response.nodeCount} nodes and saved to library`
          : `Analyzed ${response.nodeCount} nodes. Form populated but workflow not saved to library.`,
        variant: savedToLibrary ? "default" : "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Error analyzing workflow",
        description: error.message || "Failed to analyze n8n workflow",
        variant: "destructive",
      });
    }
  };

  const currentCategory = CATEGORY_METADATA.find(cat => cat.id === selectedCategory);

  const getTypeLabel = (type: GeneratorType) => {
    switch (type) {
      case "prompt_generator":
        return "Prompt";
      case "agent_helper":
        return "Agent";
      case "general_generator":
        return "General";
      default:
        return type;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto px-6 py-8 flex-1">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold" data-testid="text-page-title">
              <Sparkles className="inline-block h-10 w-10 mr-3 text-primary" />
              Playground
            </h1>
            <p className="text-lg text-muted-foreground" data-testid="text-page-description">
              Generate prompts with live validation and instant results
            </p>
          </div>

          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle>Category</CardTitle>
                  <CardDescription>Select a generator category</CardDescription>
                </div>
                <div className="w-full md:w-80">
                  <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as Category)}>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_METADATA.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id} data-testid={`option-category-${cat.id}`}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Generator Type</CardTitle>
                  <CardDescription>
                    {currentCategory?.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={selectedType} onValueChange={(value) => setSelectedType(value as GeneratorType)}>
                    <TabsList className="grid w-full grid-cols-3" data-testid="tabs-generator-type">
                      {GENERATOR_TYPES.map((type) => (
                        <TabsTrigger key={type} value={type} data-testid={`tab-${type}`}>
                          {getTypeLabel(type)}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </CardContent>
              </Card>

              <PresetManager
                currentCategory={selectedCategory}
                currentType={selectedType}
                currentInputs={currentInputs}
                onLoadPreset={handleLoadPreset}
              />

              <JSONImportExport
                currentCategory={selectedCategory}
                currentType={selectedType}
                currentInputs={currentInputs}
                onImportPromptConfig={handleImportPromptConfig}
                onImportN8nWorkflow={handleImportN8nWorkflow}
              />
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-row items-center justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle>Inputs</CardTitle>
                      <CardDescription>
                        Fill in the form to generate your prompt
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => aiAssistMutation.mutate()}
                      disabled={aiAssistMutation.isPending}
                      variant="outline"
                      data-testid="button-ai-assist"
                    >
                      {aiAssistMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          AI Assist
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <DynamicForm
                    key={`${selectedCategory}-${selectedType}-${formResetKeyRef.current}`}
                    category={selectedCategory}
                    genType={selectedType}
                    onSubmit={handleSubmit}
                    isSubmitting={generateMutation.isPending}
                    initialValues={currentInputs}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <ResultPanel
                result={result}
                isLoading={generateMutation.isPending}
                category={selectedCategory}
                genType={selectedType}
                inputs={currentInputs}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
