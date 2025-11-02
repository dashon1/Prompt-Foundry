import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Check, Zap, Shield, Code } from "lucide-react";

export default function Home() {
  const features = [
    {
      title: "All Categories",
      description: "Images, Video, YouTube, Apps, Marketing, Design, AV, Analysis, Dev, Personal, Strategy, Data, Personalization, Automation, Creation, Science, HR.",
      icon: Sparkles
    },
    {
      title: "Validated Inputs",
      description: "Zod on the edge. Zero bad payloads. Every input is validated before generation.",
      icon: Shield
    },
    {
      title: "API-First",
      description: "OpenAPI-like specs + SDK scaffolds. Build integrations with ease.",
      icon: Code
    }
  ];

  const techLogos = ["OpenAI", "TypeScript", "Zod", "React"];

  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative min-h-[700px] flex items-center justify-center overflow-hidden bg-gradient-to-b from-background via-background to-card/50">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        <div className="container mx-auto px-6 py-24 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="mb-4" data-testid="badge-version">
              <Zap className="h-3 w-3 mr-1" />
              17+ Generator Categories
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight" data-testid="text-hero-title">
              Build world-class
              <span className="block text-primary mt-2">prompts & agents</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-hero-subtitle">
              OpenAPI-like specs • Zod-validated • AI-powered
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Link href="/playground">
                <Button size="lg" className="text-base px-8" data-testid="button-launch-playground">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Launch Playground
                </Button>
              </Link>
              <Link href="/generators">
                <Button size="lg" variant="outline" className="text-base px-8" data-testid="button-browse-generators">
                  Browse Generators
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-card/30 border-y border-border">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap justify-center items-center gap-12">
            {techLogos.map((logo) => (
              <div key={logo} className="text-lg font-medium text-muted-foreground" data-testid={`text-tech-${logo.toLowerCase()}`}>
                {logo}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl font-semibold" data-testid="text-features-title">
                Everything you need to generate perfect prompts
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Powerful features designed for developers, creators, and AI enthusiasts
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="hover-elevate transition-all duration-200" data-testid={`card-feature-${index}`}>
                  <CardHeader>
                    <feature.icon className="h-12 w-12 text-primary mb-4" />
                    <CardTitle className="text-xl" data-testid={`text-feature-title-${index}`}>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed" data-testid={`text-feature-desc-${index}`}>
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-b from-card/30 to-background border-y border-border">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <Card className="border-2 border-primary/20">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-3xl md:text-4xl font-semibold mb-4" data-testid="text-cta-title">
                  Create your first generator
                </CardTitle>
                <CardDescription className="text-lg">
                  Start generating professional prompts in seconds
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Link href="/playground">
                  <Button size="lg" className="text-base px-12" data-testid="button-cta-playground">
                    <Sparkles className="h-5 w-5 mr-2" />
                    Open Playground
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
