import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Package2, FileText, Building2, Download } from "lucide-react";
import { Link } from "wouter";

interface SearchResult {
  id: number;
  supplierId: number;
  sourceType: 'price_list' | 'offer';
  sourceId: number;
  supplier: string;
  category: string | null;
  brand: string | null;
  model: string | null;
  productName: string | null;
  price: string | null;
  currency: string | null;
  stock: string | null;
  moq: string | null;
  warranty: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  groupedResults: Record<string, SearchResult[]>;
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function SearchResults({ 
  results, 
  groupedResults, 
  totalCount, 
  page, 
  limit, 
  totalPages,
  isLoading,
  onPageChange,
  onLimitChange 
}: SearchResultsProps) {
  const [displayMode, setDisplayMode] = useState<'list' | 'grouped'>('list');

  // Export results to CSV
  const exportResults = () => {
    if (!results || results.length === 0) return;
    
    const headers = ['Source', 'Supplier', 'Category', 'Brand', 'Model', 'Name', 'Price', 'Currency', 'Stock', 'MOQ', 'Notes'];
    const csvData = [headers];
    
    results.forEach(result => {
      csvData.push([
        result.sourceType === 'price_list' ? 'Price List' : 'Offer',
        result.supplier || '',
        result.category || '',
        result.brand || '',
        result.model || '',
        result.productName || '',
        result.price || '',
        result.currency || '',
        result.stock || '',
        result.moq || '',
        result.notes || ''
      ]);
    });
    
    const csvContent = csvData.map(row => 
      row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `search_results_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSourceIcon = (sourceType: string) => {
    return sourceType === 'price_list' ? <FileText className="h-4 w-4" /> : <Package2 className="h-4 w-4" />;
  };

  const getSourceColor = (sourceType: string) => {
    return sourceType === 'price_list' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Package2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or filters</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with results count and display controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Search Results ({totalCount.toLocaleString()})
          </h2>
          <Select value={displayMode} onValueChange={(value) => setDisplayMode(value as 'list' | 'grouped')}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="list">List View</SelectItem>
              <SelectItem value="grouped">Grouped by Supplier</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={exportResults}
            variant="outline" 
            className="flex items-center gap-2"
            disabled={results.length === 0}
          >
            <Download className="h-4 w-4" />
            Export Results
          </Button>
          
          <span className="text-sm text-gray-600">Show:</span>
          <Select value={limit.toString()} onValueChange={(value) => onLimitChange(parseInt(value))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Source</TableHead>
                  <TableHead className="font-semibold">Supplier</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold">Brand</TableHead>
                  <TableHead className="font-semibold">Model</TableHead>
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Price</TableHead>
                  <TableHead className="font-semibold">Currency</TableHead>
                  <TableHead className="font-semibold">Stock</TableHead>
                  <TableHead className="font-semibold">MOQ</TableHead>
                  <TableHead className="font-semibold">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayMode === 'list' ? (
                  results.map((result) => (
                    <TableRow key={result.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Badge className={getSourceColor(result.sourceType)}>
                          <span className="flex items-center gap-1">
                            {getSourceIcon(result.sourceType)}
                            {result.sourceType === 'price_list' ? 'Price List' : 'Offer'}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <Link href={`/suppliers/${result.supplierId}`}>
                            <span className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer">
                              {result.supplier}
                            </span>
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell>{result.category || '-'}</TableCell>
                      <TableCell>{result.brand || '-'}</TableCell>
                      <TableCell>{result.model || '-'}</TableCell>
                      <TableCell className="min-w-[200px] whitespace-normal break-words">
                        {result.productName || '-'}
                      </TableCell>
                      <TableCell>{result.price || '-'}</TableCell>
                      <TableCell>{result.currency || '-'}</TableCell>
                      <TableCell>{result.stock || '-'}</TableCell>
                      <TableCell>{result.moq || '-'}</TableCell>
                      <TableCell className="min-w-[150px] whitespace-normal break-words">
                        {result.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  Object.entries(groupedResults).map(([supplierName, supplierResults]) => {
                    const supplierId = supplierResults[0]?.supplierId;
                    return (
                      <TableRow key={supplierName} className="bg-blue-50">
                        <TableCell colSpan={11} className="font-semibold py-3">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-blue-600" />
                            <Link href={`/suppliers/${supplierId}`}>
                              <span className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer">
                                {supplierName}
                              </span>
                            </Link>
                            <span className="text-blue-600">({supplierResults.length} products)</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalCount)} of {totalCount} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm font-medium">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}