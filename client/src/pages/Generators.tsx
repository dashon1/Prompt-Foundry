import { useState } from "react";
import { Input } from "@/components/ui/input";
import { GeneratorCard } from "@/components/GeneratorCard";
import { CATEGORY_METADATA } from "@shared/schema";
import { Search } from "lucide-react";

export default function Generators() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = CATEGORY_METADATA.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto px-6 py-12 flex-1">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold" data-testid="text-page-title">
                Generator Catalog
              </h1>
              <p className="text-lg text-muted-foreground" data-testid="text-page-description">
                Browse all 17 categories and find the perfect generator for your needs
              </p>
            </div>

            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search generators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
          </div>

          {filteredCategories.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground" data-testid="text-no-results">
                No generators found matching your search.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCategories.map((category) => (
                <GeneratorCard key={category.id} category={category} />
              ))}
            </div>
          )}

          <div className="text-center pt-8" data-testid="text-generator-count">
            <p className="text-sm text-muted-foreground">
              Showing {filteredCategories.length} of {CATEGORY_METADATA.length} generators
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
