import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sparkles, User, LogOut, Key, History } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const [location] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Generators", href: "/generators" },
    { label: "Playground", href: "/playground" },
    { label: "API", href: "/api" }
  ];

  const getUserInitials = () => {
    if (!user) return "U";
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

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

        <div className="ml-auto flex items-center gap-4">
          {!isLoading && !isAuthenticated && (
            <>
              <Link href="/playground">
                <Button variant="ghost" data-testid="button-get-started">
                  Get Started
                </Button>
              </Link>
              <a href="/api/login">
                <Button data-testid="button-login">
                  Log In
                </Button>
              </a>
            </>
          )}

          {!isLoading && isAuthenticated && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-user-menu">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profileImageUrl || undefined} alt={user.email || "User"} />
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1">
                    {(user.firstName || user.lastName) && (
                      <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                    )}
                    {user.email && (
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <Link href="/history">
                  <DropdownMenuItem data-testid="menu-history">
                    <History className="mr-2 h-4 w-4" />
                    History
                  </DropdownMenuItem>
                </Link>
                <Link href="/api-keys">
                  <DropdownMenuItem data-testid="menu-api-keys">
                    <Key className="mr-2 h-4 w-4" />
                    API Keys
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/api/logout" data-testid="menu-logout">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
