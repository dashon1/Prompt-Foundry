import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles } from "lucide-react";
import { CATEGORY_METADATA, type Category, type GeneratorType, GENERATOR_TYPES, type Preset } from "@shared/schema";
import { DynamicForm } from "@/components/DynamicForm";
import { ResultPanel } from "@/components/ResultPanel";
import { PresetManager } from "@/components/PresetManager";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Playground() {
  const [selectedCategory, setSelectedCategory] = useState<Category>("image");
  const [selectedType, setSelectedType] = useState<GeneratorType>("prompt_generator");
  const [result, setResult] = useState<any>(null);
  const [currentInputs, setCurrentInputs] = useState<any>({});
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
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Inputs</CardTitle>
                  <CardDescription>
                    Fill in the form to generate your prompt
                  </CardDescription>
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
