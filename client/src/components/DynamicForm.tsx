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

interface DynamicFormProps {
  category: Category;
  genType: GeneratorType;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  initialValues?: any;
}

export function DynamicForm({ category, genType, onSubmit, isSubmitting, initialValues }: DynamicFormProps) {
  const schema = GENERATOR_SCHEMAS[category][genType];
  
  // Get contextual placeholder text for form fields
  const getPlaceholder = (fieldName: string): string => {
    const placeholders: Record<string, string> = {
      // Image fields
      subject: "A majestic lion in the savanna",
      setting: "Golden hour on a desert landscape",
      style_tags: "cinematic, dramatic, professional photography",
      camera: "Canon EOS R5, 85mm f/1.4",
      lighting: "Soft natural light from the side",
      mood: "Peaceful and contemplative",
      color_palette: "Warm earth tones, golden yellows",
      composition: "Rule of thirds, subject in left third",
      
      // Video fields
      duration: "30",
      lens: "Wide angle 24mm",
      motion: "Slow pan from left to right",
      audio: "Ambient nature sounds with soft music",
      
      // YouTube fields
      topic: "How to build a REST API",
      target_audience: "Beginner web developers",
      keywords: "API, REST, tutorial, coding",
      
      // App fields
      app_name: "TaskMaster Pro",
      platform: "Web and mobile (iOS, Android)",
      features: "Task tracking, reminders, collaboration",
      
      // Marketing fields
      product_name: "EcoBottle",
      audience: "Environmentally conscious millennials",
      goal: "Increase brand awareness and conversions",
      tone: "Friendly, inspiring, eco-focused",
      
      // Design fields
      design_type: "Logo design for a coffee shop",
      brand_values: "Artisanal, warm, community-focused",
      
      // General fields
      context: "This project aims to solve the problem of...",
      description: "A detailed explanation of what you need...",
      requirements: "Must be mobile-responsive and accessible",
      constraints: "Budget: $5000, Timeline: 2 weeks",
      notes: "Additional thoughts or special considerations",
      
      // Business fields
      industry: "SaaS, B2B software",
      company_size: "50-100 employees",
      challenge: "High customer churn rate",
      
      // Content fields
      title: "10 Ways to Boost Your Productivity",
      content_type: "Blog post",
      word_count: "1500",
      
      // Technical fields
      tech_stack: "React, Node.js, PostgreSQL",
      language: "TypeScript",
      framework: "Next.js",
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
    if (fieldSchema._def?.typeName === "ZodDefault") {
      actualSchema = fieldSchema._def.innerType;
    }
    
    const fieldType = actualSchema._def?.typeName;

    if (fieldType === "ZodBoolean") {
      return (
        <FormField
          key={fieldName}
          control={form.control}
          name={fieldName}
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base capitalize">
                  {fieldName.replace(/_/g, " ")}
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
              <FormLabel className="capitalize">{fieldName.replace(/_/g, " ")}</FormLabel>
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
          render={({ field }) => {
            const values = field.value || [];
            const [inputValue, setInputValue] = React.useState("");

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
              <FormItem>
                <FormLabel className="capitalize">{fieldName.replace(/_/g, " ")}</FormLabel>
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
                      placeholder={`${getPlaceholder(fieldName)} (press Enter to add)`}
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
                <FormMessage />
              </FormItem>
            );
          }}
        />
      );
    }

    if (fieldType === "ZodObject") {
      const objectFields = actualSchema._def?.shape?.() || {};
      return (
        <div key={fieldName} className="space-y-4 p-4 border border-border rounded-lg">
          <h4 className="font-medium capitalize">{fieldName.replace(/_/g, " ")}</h4>
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
            <FormLabel className="capitalize">{fieldName.replace(/_/g, " ")}</FormLabel>
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

import React from "react";
