import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Code } from "lucide-react";

export default function API() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto px-6 py-12 flex-1">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Code className="h-8 w-8 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold" data-testid="text-page-title">
                API Documentation
              </h1>
            </div>
            <p className="text-lg text-muted-foreground" data-testid="text-page-description">
              RESTful API for generating prompts across all 17 categories
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Endpoint Structure</CardTitle>
              <CardDescription>All generator endpoints follow this pattern</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted rounded-lg p-4 font-mono text-sm" data-testid="code-endpoint">
                <span className="text-accent">POST</span>{" "}
                <span className="text-foreground">/api/generator/</span>
                <span className="text-primary">&#123;category&#125;</span>
                <span className="text-foreground">/</span>
                <span className="text-secondary">&#123;genType&#125;</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-start space-x-3">
                  <Badge variant="secondary" className="mt-1">category</Badge>
                  <div>
                    <p className="text-sm font-medium">Generator Category</p>
                    <p className="text-sm text-muted-foreground">
                      One of: image, video, youtube_titles, apps, marketing_content, visual_design, av_production, business_analysis, dev_tasks, personal_helper, strategy_innovation, data_decision, hyper_personalization, automation_augmentation, content_creation, science_rnd, hr_operations
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Badge variant="secondary" className="mt-1">genType</Badge>
                  <div>
                    <p className="text-sm font-medium">Generator Type</p>
                    <p className="text-sm text-muted-foreground">
                      One of: prompt_generator, agent_helper, general_generator
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="request" className="w-full">
            <TabsList className="grid w-full grid-cols-2" data-testid="tabs-api-docs">
              <TabsTrigger value="request" data-testid="tab-request">Request</TabsTrigger>
              <TabsTrigger value="response" data-testid="tab-response">Response</TabsTrigger>
            </TabsList>

            <TabsContent value="request" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Request Format</CardTitle>
                  <CardDescription>Send a JSON payload with the required inputs</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted rounded-lg p-4 overflow-x-auto" data-testid="code-request-example">
                    <code className="text-sm font-mono text-foreground">{`{
  "subject": "red fox",
  "setting": "misty forest clearing at dawn",
  "style_tags": ["editorial realism", "8K clarity"],
  "camera": {
    "lens": "Leica APO",
    "focal_length_mm": 90,
    "aperture": "f/2.0",
    "angle": "eye-level",
    "distance": "close-up"
  },
  "lighting": {
    "type": "soft diffused",
    "direction": "back-left rim",
    "time_of_day": "dawn"
  },
  "mood": "serene",
  "color_palette": ["warm gold", "forest green"],
  "composition": "subject centered with shallow DOF",
  "technical": ["true-to-life color"],
  "negatives": ["no collars", "no text"]
}`}</code>
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="response" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Response Format</CardTitle>
                  <CardDescription>Receive generated prompts and metadata</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted rounded-lg p-4 overflow-x-auto" data-testid="code-response-example">
                    <code className="text-sm font-mono text-foreground">{`{
  "output": {
    "final_prompt": "A red fox in a misty forest..."
  },
  "metadata": {
    "category": "image",
    "genType": "prompt_generator",
    "timestamp": "2025-01-01T12:00:00Z"
  }
}`}</code>
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle>Example cURL</CardTitle>
              <CardDescription>Quick start with command line</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted rounded-lg p-4 overflow-x-auto" data-testid="code-curl-example">
                <code className="text-sm font-mono text-foreground">{`curl -X POST http://localhost:5000/api/generator/image/prompt_generator \\
  -H "Content-Type: application/json" \\
  -d '{"subject": "red fox", "setting": "forest"}'`}</code>
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
