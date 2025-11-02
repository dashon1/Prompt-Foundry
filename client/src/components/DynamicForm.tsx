import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { InputWithSpeech } from "@/components/ui/input-with-speech";
import { TextareaWithSpeech } from "@/components/ui/textarea-with-speech";
import { Switch } from "@/components/ui/switch";
import { GENERATOR_SCHEMAS, type Category, type GeneratorType } from "@shared/schema";
import { Loader2, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useState } from "react";

interface DynamicFormProps {
  category: Category;
  genType: GeneratorType;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  initialValues?: any;
}

// Separate component for array fields to avoid conditional hooks
function ArrayFieldInput({ field, fieldName, placeholder }: { field: any; fieldName: string; placeholder: string }) {
  const values = field.value || [];
  const [inputValue, setInputValue] = useState("");

  const addItem = () => {
    if (inputValue.trim()) {
      field.onChange([...values, inputValue.trim()]);
      setInputValue("");
    }
  };

  const removeItem = (index: number) => {
    const newValues = values.filter((_: any, i: number) => i !== index);
    field.onChange(newValues);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <InputWithSpeech
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
          placeholder={`${placeholder} (press Enter to add)`}
          data-testid={`input-${fieldName}`}
        />
        <Button type="button" onClick={addItem} variant="outline" size="icon" data-testid={`button-add-${fieldName}`}>
          +
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((item: any, index: number) => (
            <Badge key={index} variant="secondary" className="gap-1" data-testid={`badge-${fieldName}-${index}`}>
              {item}
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="hover-elevate rounded-full"
                data-testid={`button-remove-${fieldName}-${index}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export function DynamicForm({ category, genType, onSubmit, isSubmitting, initialValues }: DynamicFormProps) {
  const schema = GENERATOR_SCHEMAS[category][genType];
  
  // Get contextual placeholder text for form fields with helpful examples
  const getPlaceholder = (fieldName: string): string => {
    const placeholders: Record<string, string> = {
      // General Generator fields - AI input examples
      item: "Example: A cyberpunk city at night with neon lights",
      topic_or_item: "Example: Tutorial on building a chatbot with Python",
      context: "Example: This is for a tech startup's website hero section, targeting developers aged 25-35",
      visual_intent: "Example: Modern, sleek, minimalist with bold colors",
      camera_prefs: "Example: Wide angle for landscapes, or close-up for portraits",
      lighting_prefs: "Example: Dramatic side lighting for mood, or soft natural light for warmth",
      visual_style: "Example: Cinematic with slow motion effects",
      camera_style: "Example: Handheld documentary style with natural movement",
      audio_style: "Example: Upbeat electronic music with ambient city sounds",
      
      // Image fields
      subject: "Example: A majestic lion standing on a cliff",
      setting: "Example: African savanna at sunset with golden light",
      style_tags: "Example: cinematic, dramatic, ultra-realistic, 8K",
      lighting_type: "Example: Natural sunlight, studio lighting, or dramatic shadows",
      lens: "Example: 85mm for portraits, 24mm for landscapes",
      mood: "Example: Peaceful and contemplative, or energetic and exciting",
      color_palette: "Example: Warm earth tones, cool blues and purples",
      composition: "Example: Rule of thirds with subject in left third",
      negatives: "Example: blurry, low quality, distorted",
      
      // Video fields
      concept: "Example: A day in the life of a coffee shop owner",
      duration_seconds: "Example: 30 (for social media) or 120 (for YouTube)",
      motion: "Example: Slow dolly push-in, smooth pan from left to right",
      audio: "Example: Upbeat indie music with cafe ambient sounds",
      
      // YouTube fields
      topic: "Example: How to master TypeScript in 2024",
      target_audience: "Example: Junior developers learning modern web development",
      audience: "Example: Tech-savvy millennials interested in productivity",
      keywords: "Example: TypeScript, JavaScript, tutorial, coding, web dev",
      tone: "Example: Friendly, educational, encouraging",
      draft_titles: "Example: 10 TypeScript Tips You NEED to Know",
      
      // App fields
      app_name: "Example: TaskFlow Pro",
      platform: "Example: iOS, Android, and Web (React Native)",
      features: "Example: Task management, team collaboration, time tracking",
      
      // Marketing fields
      product_name: "Example: EcoBottle - Sustainable Water Bottle",
      goal: "Example: Increase brand awareness and drive conversions by 25%",
      
      // Design fields
      design_type: "Example: Modern logo for a tech startup",
      brand_values: "Example: Innovation, trust, sustainability, user-focused",
      
      // Business fields
      industry: "Example: SaaS, B2B software for small businesses",
      company_size: "Example: 50-100 employees, mid-sized company",
      challenge: "Example: High customer churn rate in first 90 days",
      
      // Content fields
      title: "Example: 10 Proven Ways to Boost Your Productivity in 2024",
      content_type: "Example: Blog post, social media thread, email newsletter",
      word_count: "Example: 1500 words for blog, 300 for social media",
      
      // Technical fields
      tech_stack: "Example: React, TypeScript, Node.js, PostgreSQL, Docker",
      language: "Example: TypeScript, Python, Go",
      framework: "Example: Next.js, Express, FastAPI",
      
      // Generic helpful fields
      description: "Example: A detailed explanation of your requirements and goals",
      requirements: "Example: Must be mobile-responsive, accessible (WCAG 2.1), fast loading",
      constraints: "Example: Budget: $5,000, Timeline: 2 weeks, Team size: 3",
      notes: "Example: Additional context, special considerations, or preferences",
    };
    
    // Return specific placeholder or generate a generic one
    return placeholders[fieldName] || `Enter ${fieldName.replace(/_/g, " ")}...`;
  };
  
  // Build default values from schema to keep form controlled
  const getDefaultValues = () => {
    // Parse empty object through schema to get all defaults
    try {
      const defaults = schema.parse({});
      return { ...defaults, ...initialValues };
    } catch {
      // If schema parse fails, build defaults manually
      const defaults: any = {};
      const shape = (schema as any).shape || (schema as any)._def?.shape?.();
      
      if (shape) {
        Object.entries(shape).forEach(([fieldName, fieldSchema]: any) => {
          const fieldType = fieldSchema._def?.typeName;
          
          // Check if field has a default
          if (fieldSchema._def?.defaultValue !== undefined) {
            defaults[fieldName] = typeof fieldSchema._def.defaultValue === 'function' 
              ? fieldSchema._def.defaultValue()
              : fieldSchema._def.defaultValue;
          } else if (fieldType === "ZodBoolean") {
            defaults[fieldName] = false;
          } else if (fieldType === "ZodNumber") {
            defaults[fieldName] = 0;
          } else if (fieldType === "ZodArray") {
            defaults[fieldName] = [];
          } else if (fieldType === "ZodObject") {
            defaults[fieldName] = {};
          } else {
            defaults[fieldName] = "";
          }
        });
      }
      
      return { ...defaults, ...initialValues };
    }
  };
  
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues()
  });

  const renderField = (fieldName: string, fieldSchema: any) => {
    // Handle ZodDefault wrapper - unwrap it to get the actual type
    let actualSchema = fieldSchema;
    let hasDefault = false;
    if (fieldSchema._def?.typeName === "ZodDefault") {
      actualSchema = fieldSchema._def.innerType;
      hasDefault = true;
    }
    
    const fieldType = actualSchema._def?.typeName;
    
    // Check if field is optional (has .optional() or has a default)
    const isOptional = actualSchema._def?.typeName === "ZodOptional" || hasDefault;

    if (fieldType === "ZodBoolean") {
      return (
        <FormField
          key={fieldName}
          control={form.control}
          name={fieldName}
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base capitalize flex items-center gap-2">
                  {fieldName.replace(/_/g, " ")}
                  {isOptional && <Badge variant="outline" className="text-xs">Optional</Badge>}
                </FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  data-testid={`switch-${fieldName}`}
                />
              </FormControl>
            </FormItem>
          )}
        />
      );
    }

    if (fieldType === "ZodNumber") {
      return (
        <FormField
          key={fieldName}
          control={form.control}
          name={fieldName}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="capitalize flex items-center gap-2">
                {fieldName.replace(/_/g, " ")}
                {isOptional && <Badge variant="outline" className="text-xs">Optional</Badge>}
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder={getPlaceholder(fieldName)}
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  data-testid={`input-${fieldName}`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    }

    if (fieldType === "ZodArray") {
      return (
        <FormField
          key={fieldName}
          control={form.control}
          name={fieldName}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="capitalize flex items-center gap-2">
                {fieldName.replace(/_/g, " ")}
                {isOptional && <Badge variant="outline" className="text-xs">Optional</Badge>}
              </FormLabel>
              <ArrayFieldInput 
                field={field} 
                fieldName={fieldName} 
                placeholder={getPlaceholder(fieldName)} 
              />
              <FormMessage />
            </FormItem>
          )}
        />
      );
    }

    if (fieldType === "ZodObject") {
      const objectFields = actualSchema._def?.shape?.() || {};
      return (
        <div key={fieldName} className="space-y-4 p-4 border border-border rounded-lg">
          <h4 className="font-medium capitalize flex items-center gap-2">
            {fieldName.replace(/_/g, " ")}
            {isOptional && <Badge variant="outline" className="text-xs">Optional</Badge>}
          </h4>
          {Object.entries(objectFields).map(([nestedField, nestedSchema]: any) => {
            // Handle ZodDefault wrapper for nested fields too
            let actualNestedSchema = nestedSchema;
            if (nestedSchema._def?.typeName === "ZodDefault") {
              actualNestedSchema = nestedSchema._def.innerType;
            }
            const nestedType = actualNestedSchema._def?.typeName;
            const isNumber = nestedType === "ZodNumber";
            
            return (
              <FormField
                key={`${fieldName}.${nestedField}`}
                control={form.control}
                name={`${fieldName}.${nestedField}` as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="capitalize text-sm">
                      {nestedField.replace(/_/g, " ")}
                    </FormLabel>
                    <FormControl>
                      {isNumber ? (
                        <Input
                          type="number"
                          placeholder={getPlaceholder(nestedField)}
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          data-testid={`input-${fieldName}-${nestedField}`}
                        />
                      ) : (
                        <InputWithSpeech
                          placeholder={getPlaceholder(nestedField)}
                          {...field}
                          data-testid={`input-${fieldName}-${nestedField}`}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            );
          })}
        </div>
      );
    }

    // Default: string with textarea for longer fields
    const isLongField = fieldName.includes("description") || fieldName.includes("context") || fieldName.includes("notes");
    
    return (
      <FormField
        key={fieldName}
        control={form.control}
        name={fieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="capitalize flex items-center gap-2">
              {fieldName.replace(/_/g, " ")}
              {isOptional && <Badge variant="outline" className="text-xs">Optional</Badge>}
            </FormLabel>
            <FormControl>
              {isLongField ? (
                <TextareaWithSpeech
                  {...field}
                  rows={3}
                  placeholder={getPlaceholder(fieldName)}
                  data-testid={`textarea-${fieldName}`}
                />
              ) : (
                <InputWithSpeech 
                  {...field} 
                  placeholder={getPlaceholder(fieldName)}
                  data-testid={`input-${fieldName}`} 
                />
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  const shape = (schema as any).shape || (schema as any)._def?.shape?.();
  const fields = shape || {};

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {Object.entries(fields).map(([fieldName, fieldSchema]: any) =>
          renderField(fieldName, fieldSchema)
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
          data-testid="button-generate"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Generate Prompt
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
