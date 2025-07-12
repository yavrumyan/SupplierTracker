import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

export interface ProductSearchFilters {
  keyword1?: string;
  keyword2?: string;
  keyword3?: string;
  source?: string;
  supplier?: string;
  category?: string;
  brand?: string;
}

interface ProductSearchFiltersProps {
  filters: ProductSearchFilters;
  onFiltersChange: (filters: ProductSearchFilters) => void;
  onSearch: () => void;
}

export function ProductSearchFilters({ filters, onFiltersChange, onSearch }: ProductSearchFiltersProps) {
  
  // Fetch suppliers for dropdown
  const { data: suppliers = [] } = useQuery({
    queryKey: ['/api/suppliers'],
    queryFn: async () => {
      const response = await fetch('/api/suppliers');
      if (!response.ok) throw new Error('Failed to fetch suppliers');
      return response.json();
    }
  });

  // Fetch categories and brands from search index
  const { data: searchMetadata = { categories: [], brands: [] } } = useQuery({
    queryKey: ['/api/search/metadata'],
    queryFn: async () => {
      const response = await fetch('/api/search/metadata');
      if (!response.ok) throw new Error('Failed to fetch search metadata');
      return response.json();
    }
  });

  const handleFilterChange = (key: keyof ProductSearchFilters, value: string | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value === "" || value === "all" ? undefined : value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Product Search</h3>
        
        {/* Three keyword search bars */}
        <div className="mb-6">
          <Label className="text-sm font-medium text-slate-700 mb-2 block">
            Search Keywords (AND logic - all must match)
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Keyword 1..."
                className="pl-10"
                value={filters.keyword1 || ""}
                onChange={(e) => handleFilterChange("keyword1", e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Keyword 2..."
                className="pl-10"
                value={filters.keyword2 || ""}
                onChange={(e) => handleFilterChange("keyword2", e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Keyword 3..."
                className="pl-10"
                value={filters.keyword3 || ""}
                onChange={(e) => handleFilterChange("keyword3", e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
          </div>
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <Label className="text-sm font-medium text-slate-700">Source</Label>
            <Select value={filters.source || "all"} onValueChange={(value) => handleFilterChange("source", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="price_list">Price List</SelectItem>
                <SelectItem value="offer">Offer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-slate-700">Supplier</Label>
            <Select value={filters.supplier || "all"} onValueChange={(value) => handleFilterChange("supplier", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Suppliers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                {suppliers.map((supplier: any) => (
                  <SelectItem key={supplier.id} value={supplier.name}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-slate-700">Category</Label>
            <Select value={filters.category || "all"} onValueChange={(value) => handleFilterChange("category", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {searchMetadata.categories.map((category: string) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-slate-700">Brand</Label>
            <Select value={filters.brand || "all"} onValueChange={(value) => handleFilterChange("brand", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {searchMetadata.brands.map((brand: string) => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button onClick={onSearch} className="flex-1 bg-orange-500 hover:bg-orange-600">
            <Search className="h-4 w-4 mr-2" />
            Search Products
          </Button>
          <Button variant="outline" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}