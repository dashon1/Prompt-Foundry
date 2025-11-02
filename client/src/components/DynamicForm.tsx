import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  
  // Build default values from schema to keep form controlled
  const getDefaultValues = () => {
    const defaults: any = {};
    const fields = schema._def.shape();
    
    Object.entries(fields).forEach(([fieldName, fieldSchema]: any) => {
      const fieldType = fieldSchema._def?.typeName;
      
      if (fieldType === "ZodBoolean") {
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
    
    return { ...defaults, ...initialValues };
  };
  
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues()
  });

  const renderField = (fieldName: string, fieldSchema: any) => {
    const fieldType = fieldSchema._def?.typeName;

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
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addItem();
                        }
                      }}
                      placeholder="Type and press Enter"
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
      const objectFields = fieldSchema._def.shape();
      return (
        <div key={fieldName} className="space-y-4 p-4 border border-border rounded-lg">
          <h4 className="font-medium capitalize">{fieldName.replace(/_/g, " ")}</h4>
          {Object.entries(objectFields).map(([nestedField, nestedSchema]: any) => {
            const nestedType = nestedSchema._def?.typeName;
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
                      <Input
                        type={nestedType === "ZodNumber" ? "number" : "text"}
                        {...field}
                        onChange={(e) => {
                          const value = nestedType === "ZodNumber" ? parseFloat(e.target.value) : e.target.value;
                          field.onChange(value);
                        }}
                        data-testid={`input-${fieldName}-${nestedField}`}
                      />
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
                <Textarea
                  {...field}
                  rows={3}
                  data-testid={`textarea-${fieldName}`}
                />
              ) : (
                <Input {...field} data-testid={`input-${fieldName}`} />
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  const fields = schema._def.shape();

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
