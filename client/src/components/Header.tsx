import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export function Header() {
  const [location] = useLocation();

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Generators", href: "/generators" },
    { label: "Playground", href: "/playground" },
    { label: "API", href: "/api" }
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-6">
        <Link href="/" className="flex items-center space-x-2 hover-elevate active-elevate-2 rounded-md px-2 py-1 -ml-2" data-testid="link-home">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">Prompt Foundry</span>
        </Link>

        <nav className="ml-12 hidden md:flex space-x-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} data-testid={`link-${item.label.toLowerCase()}`}>
              <Button
                variant={location === item.href ? "secondary" : "ghost"}
                className="text-sm font-medium"
              >
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center space-x-4">
          <Link href="/playground">
            <Button data-testid="button-get-started">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
