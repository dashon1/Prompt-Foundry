import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import * as Icons from "lucide-react";
import type { CategoryMetadata } from "@shared/schema";

interface GeneratorCardProps {
  category: CategoryMetadata;
}

export function GeneratorCard({ category }: GeneratorCardProps) {
  const IconComponent = Icons[category.icon as keyof typeof Icons] as any;

  return (
    <Card className="hover-elevate transition-all duration-200" data-testid={`card-generator-${category.id}`}>
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          {IconComponent && <IconComponent className="h-10 w-10 text-primary" />}
          <Badge variant="secondary" className="text-xs" data-testid={`badge-category-${category.id}`}>
            3 Types
          </Badge>
        </div>
        <div>
          <CardTitle className="text-xl" data-testid={`text-category-name-${category.id}`}>{category.name}</CardTitle>
          <CardDescription className="mt-2 line-clamp-2" data-testid={`text-category-desc-${category.id}`}>
            {category.description}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Link href={`/playground?category=${category.id}`}>
          <Button className="w-full" variant="outline" data-testid={`button-try-${category.id}`}>
            Try Generator
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
