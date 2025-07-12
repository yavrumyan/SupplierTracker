import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { SearchFilters } from "@/components/search-filters";
import { SearchResults } from "@/components/search-results";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X } from "lucide-react";
import type { SearchFilters as SearchFiltersType } from "@/lib/types";

export default function SearchPage() {
  const [filters, setFilters] = useState<SearchFiltersType>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(50);
  const [appliedFilters, setAppliedFilters] = useState<SearchFiltersType>({});

  // Build search parameters
  const searchParams = new URLSearchParams();
  if (appliedFilters.keyword1) searchParams.append('keyword1', appliedFilters.keyword1);
  if (appliedFilters.keyword2) searchParams.append('keyword2', appliedFilters.keyword2);
  if (appliedFilters.keyword3) searchParams.append('keyword3', appliedFilters.keyword3);
  if (appliedFilters.category) searchParams.append('category', appliedFilters.category);
  if (appliedFilters.brand) searchParams.append('brand', appliedFilters.brand);
  if (appliedFilters.supplier) searchParams.append('supplier', appliedFilters.supplier);
  if (appliedFilters.sourceType) searchParams.append('sourceType', appliedFilters.sourceType);
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

  // Handle search execution
  const handleSearch = () => {
    setAppliedFilters({ ...filters });
    setCurrentPage(1);
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters: SearchFiltersType) => {
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
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Search</h1>
          <p className="text-gray-600">
            Search across all price lists and supplier offers to find the products you need
          </p>
        </div>

        {/* Search filters */}
        <div className="mb-6">
          <SearchFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onSearch={handleSearch}
          />
        </div>

        {/* Active filters display */}
        {activeFilterCount > 0 && (
          <Card className="mb-6">
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
                      "{appliedFilters.keyword1}"
                    </Badge>
                  )}
                  {appliedFilters.keyword2 && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Search className="h-3 w-3" />
                      "{appliedFilters.keyword2}"
                    </Badge>
                  )}
                  {appliedFilters.keyword3 && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Search className="h-3 w-3" />
                      "{appliedFilters.keyword3}"
                    </Badge>
                  )}
                  {appliedFilters.sourceType && (
                    <Badge variant="secondary">
                      Source: {appliedFilters.sourceType}
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
                  {appliedFilters.supplier && (
                    <Badge variant="secondary">
                      Supplier: {appliedFilters.supplier}
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
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Product Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Use the keyword search and filters above to find products across all supplier price lists and offers.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Multiple Keywords</h4>
                  <p className="text-sm text-blue-700">
                    Use up to 3 keywords with AND logic for precise results
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Smart Filters</h4>
                  <p className="text-sm text-green-700">
                    Filter by source type, supplier, category, or brand
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">All Sources</h4>
                  <p className="text-sm text-purple-700">
                    Search across price lists and offers simultaneously
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="text-red-600">
                <p className="font-semibold">Error loading search results</p>
                <p className="text-sm">{error.message}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}