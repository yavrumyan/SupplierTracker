import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import type { SearchFilters } from "@/lib/types";
import { useCategoriesBrands } from "@/lib/categories-brands-context";

interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  availableCountries?: string[];
}

export function SearchFilters({ filters, onFiltersChange, onSearch, availableCountries = [] }: SearchFiltersProps) {
  const { categories, brands } = useCategoriesBrands();
  
  const handleFilterChange = (key: keyof SearchFilters, value: string | number | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value === "" || value === "all" ? undefined : value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Search Suppliers</h3>
        
        {/* Search bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search products, keywords, or supplier names..."
              className="pl-10"
              value={filters.query || ""}
              onChange={(e) => handleFilterChange("query", e.target.value)}
            />
          </div>
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label className="text-sm font-medium text-slate-700">Country</Label>
            <Select value={filters.country || "all"} onValueChange={(value) => handleFilterChange("country", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {availableCountries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-slate-700">Trading Categories</Label>
            <Select value={filters.category || "all"} onValueChange={(value) => handleFilterChange("category", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-slate-700">Trading Brands</Label>
            <Select value={filters.brand || "all"} onValueChange={(value) => handleFilterChange("brand", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-slate-700">Min. Reputation</Label>
            <Select 
              value={filters.minReputation?.toString() || "all"} 
              onValueChange={(value) => handleFilterChange("minReputation", value === "all" ? undefined : parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Rating</SelectItem>
                <SelectItem value="10">10 Stars</SelectItem>
                <SelectItem value="9">9+ Stars</SelectItem>
                <SelectItem value="8">8+ Stars</SelectItem>
                <SelectItem value="7">7+ Stars</SelectItem>
                <SelectItem value="6">6+ Stars</SelectItem>
                <SelectItem value="5">5+ Stars</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3 mt-4">
          <Button onClick={onSearch} className="bg-orange-500 hover:bg-orange-600">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button variant="outline" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
