import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProductSearchFilters, type ProductSearchFilters as ProductSearchFiltersType } from "@/components/product-search-filters";
import { SearchResults } from "@/components/search-results";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X } from "lucide-react";

export default function SearchPage() {
  const [filters, setFilters] = useState<ProductSearchFiltersType>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(50);
  const [appliedFilters, setAppliedFilters] = useState<ProductSearchFiltersType>({});

  // Build search parameters
  const searchParams = new URLSearchParams();
  if (appliedFilters.keyword1) searchParams.append('keyword1', appliedFilters.keyword1);
  if (appliedFilters.keyword2) searchParams.append('keyword2', appliedFilters.keyword2);
  if (appliedFilters.keyword3) searchParams.append('keyword3', appliedFilters.keyword3);
  if (appliedFilters.source) searchParams.append('source', appliedFilters.source);
  if (appliedFilters.country) searchParams.append('country', appliedFilters.country);
  if (appliedFilters.supplier) searchParams.append('supplier', appliedFilters.supplier);
  if (appliedFilters.category) searchParams.append('category', appliedFilters.category);
  if (appliedFilters.brand) searchParams.append('brand', appliedFilters.brand);
  searchParams.append('page', currentPage.toString());
  searchParams.append('limit', pageLimit.toString());

  // Fetch search results
  const { data: searchData, isLoading, error } = useQuery({
    queryKey: ['/api/search', searchParams.toString()],
    queryFn: async () => {
      const response = await fetch(`/api/search?${searchParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch search results');
      }
      return response.json();
    },
    enabled: Object.keys(appliedFilters).length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Handle export of all results
  const handleExportAll = async () => {
    try {
      const allParams = new URLSearchParams(searchParams);
      allParams.delete('page');
      allParams.set('limit', '0'); // Request all results
      
      const response = await fetch(`/api/search?${allParams}`);
      if (!response.ok) throw new Error('Failed to fetch all results for export');
      
      const data = await response.json();
      return data.results || [];
    } catch (err) {
      console.error('Export error:', err);
      throw err;
    }
  };

  // Handle search execution
  const handleSearch = () => {
    setAppliedFilters({ ...filters });
    setCurrentPage(1);
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters: ProductSearchFiltersType) => {
    setFilters(newFilters);
  };

  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle limit changes
  const handleLimitChange = (limit: number) => {
    setPageLimit(limit);
    setCurrentPage(1);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({});
    setAppliedFilters({});
    setCurrentPage(1);
  };

  // Get active filter count
  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 -mx-6 -mt-6 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-800 ml-[35px] mr-[35px]">Product Search</h1>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">GY</span>
            </div>
            <span className="text-sm font-medium text-slate-700">Greg</span>
          </div>
        </div>
      </div>
      {/* Search filters */}
      <div onKeyDown={handleKeyDown}>
        <ProductSearchFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onSearch={handleSearch}
        />
      </div>
      {/* Active filters display */}
      {activeFilterCount > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Active Filters:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {appliedFilters.keyword1 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Search className="h-3 w-3" />
                    Keyword 1: "{appliedFilters.keyword1}"
                  </Badge>
                )}
                {appliedFilters.keyword2 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Search className="h-3 w-3" />
                    Keyword 2: "{appliedFilters.keyword2}"
                  </Badge>
                )}
                {appliedFilters.keyword3 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Search className="h-3 w-3" />
                    Keyword 3: "{appliedFilters.keyword3}"
                  </Badge>
                )}
                {appliedFilters.source && (
                  <Badge variant="secondary">
                    Source: {appliedFilters.source}
                  </Badge>
                )}
                {appliedFilters.country && (
                  <Badge variant="secondary">
                    Country: {appliedFilters.country}
                  </Badge>
                )}
                {appliedFilters.supplier && (
                  <Badge variant="secondary">
                    Supplier: {appliedFilters.supplier}
                  </Badge>
                )}
                {appliedFilters.category && (
                  <Badge variant="secondary">
                    Category: {appliedFilters.category}
                  </Badge>
                )}
                {appliedFilters.brand && (
                  <Badge variant="secondary">
                    Brand: {appliedFilters.brand}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="ml-auto"
              >
                <X className="h-4 w-4" />
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Search results */}
      {Object.keys(appliedFilters).length > 0 ? (
        <SearchResults
          results={searchData?.results || []}
          groupedResults={searchData?.groupedResults || {}}
          totalCount={searchData?.totalCount || 0}
          page={searchData?.page || 1}
          limit={searchData?.limit || 50}
          totalPages={searchData?.totalPages || 1}
          isLoading={isLoading}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          onExportAll={handleExportAll}
        />
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Start your product search</h3>
            <p className="text-gray-600">
              Use the search filters above to find products across all price lists and supplier offers
            </p>
          </CardContent>
        </Card>
      )}
      {error && (
        <Card>
          <CardContent className="p-4">
            <div className="text-red-600">
              <p className="font-semibold">Error loading search results</p>
              <p className="text-sm">{error.message}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}