
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Package, DollarSign, TrendingUp, Truck, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface ProductSearchResult {
  productName: string;
  stock: number;
  transit: number;
  retailPriceUsd: number | null;
  wholesalePrice1: number | null;
  currentCost: number | null;
  lastPrice: number | null;
  lastSupplier: string | null;
  sold30d: number;
  sold60d: number;
  sold90d: number;
  avgSalePrice: number | null;
  profitPerUnit: number | null;
  kievyanStock: number;
  sevanStock: number;
  supplierOffers: Array<{
    supplier: string;
    price: string;
    currency: string;
    stock: string;
    sourceType: string;
  }>;
}

export default function CompStyleProductSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch all necessary data for search
  const { data: productList } = useQuery({
    queryKey: ['/api/compstyle/product-list'],
    enabled: false,
  });

  const { data: totalSales } = useQuery({
    queryKey: ['/api/compstyle/total-sales'],
    enabled: false,
  });

  const { data: profitabilityData } = useQuery({
    queryKey: ['/api/compstyle/analytics/profitability-heat-map'],
    enabled: false,
  });

  const { data: kievyanStock } = useQuery({
    queryKey: ['/api/compstyle/kievyan-stock'],
    enabled: false,
  });

  const { data: sevanStock } = useQuery({
    queryKey: ['/api/compstyle/sevan-stock'],
    enabled: false,
  });

  const { data: orderRecommendations } = useQuery({
    queryKey: ['/api/compstyle/analytics/order-recommendations'],
    enabled: false,
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);

    try {
      // Search in CompStyle data
      const normalizedQuery = searchQuery.toLowerCase().trim();
      const results: ProductSearchResult[] = [];

      // Search in product list
      if (productList) {
        const matchingProducts = (productList as any[]).filter((p: any) =>
          p.productName.toLowerCase().includes(normalizedQuery)
        );

        for (const product of matchingProducts) {
          // Get sales data
          const salesData = (totalSales as any[])?.find((s: any) => 
            s.productName === product.productName
          );

          // Get profitability data
          const profitData = (profitabilityData as any[])?.find((p: any) => 
            p.productName === product.productName
          );

          // Get location stock
          const kievyan = (kievyanStock as any[])?.filter((k: any) => 
            k.productName === product.productName
          ).reduce((sum, item) => sum + item.qty, 0) || 0;

          const sevan = (sevanStock as any[])?.filter((s: any) => 
            s.productName === product.productName
          ).reduce((sum, item) => sum + item.qty, 0) || 0;

          // Get order recommendation data for sold quantities
          const orderRec = (orderRecommendations as any[])?.find((o: any) => 
            o.productName === product.productName
          );

          results.push({
            productName: product.productName,
            stock: product.stock || 0,
            transit: product.transit || 0,
            retailPriceUsd: product.retailPriceUsd ? parseFloat(product.retailPriceUsd) : null,
            wholesalePrice1: product.dealerPrice1 ? parseFloat(product.dealerPrice1) : null,
            currentCost: product.cost ? parseFloat(product.cost) : null,
            lastPrice: product.latestPurchase ? parseFloat(product.latestPurchase) : null,
            lastSupplier: product.supplier,
            sold30d: orderRec?.sold30D || 0,
            sold60d: orderRec?.sold60D || 0,
            sold90d: orderRec?.sold90D || 0,
            avgSalePrice: profitData?.retailPriceUsd || null,
            profitPerUnit: profitData?.profitPerUnit || null,
            kievyanStock: kievyan,
            sevanStock: sevan,
            supplierOffers: [],
          });
        }
      }

      // Search in supplier database (price lists and offers)
      const supplierSearchResponse = await fetch(
        `/api/search?keyword1=${encodeURIComponent(searchQuery)}`
      );
      const supplierSearchData = await supplierSearchResponse.json();

      if (supplierSearchData.results) {
        // Group supplier offers by product name
        const offersByProduct = new Map<string, any[]>();

        for (const result of supplierSearchData.results) {
          const productName = result.productName || result.model || '';
          if (!productName) continue;

          if (!offersByProduct.has(productName)) {
            offersByProduct.set(productName, []);
          }

          offersByProduct.get(productName)!.push({
            supplier: result.supplier,
            price: result.price || 'N/A',
            currency: result.currency || 'N/A',
            stock: result.stock || 'N/A',
            sourceType: result.sourceType,
          });
        }

        // Add supplier offers to existing results or create new entries
        for (const [productName, offers] of offersByProduct) {
          const existingResult = results.find(r => 
            r.productName.toLowerCase() === productName.toLowerCase()
          );

          if (existingResult) {
            existingResult.supplierOffers = offers;
          } else {
            results.push({
              productName,
              stock: 0,
              transit: 0,
              retailPriceUsd: null,
              wholesalePrice1: null,
              currentCost: null,
              lastPrice: null,
              lastSupplier: null,
              sold30d: 0,
              sold60d: 0,
              sold90d: 0,
              avgSalePrice: null,
              profitPerUnit: null,
              kievyanStock: 0,
              sevanStock: 0,
              supplierOffers: offers,
            });
          }
        }
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/compstyle">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to CompStyle
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Product Search</h1>
          <p className="text-slate-600">
            Search products across inventory, sales data, and supplier databases
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Enter product name to search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full text-lg"
                />
              </div>
              <Button 
                onClick={handleSearch} 
                disabled={isSearching || !searchQuery.trim()}
                className="px-8"
              >
                <Search className="h-4 w-4 mr-2" />
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
            </h2>

            {searchResults.map((result, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="bg-blue-50 border-b border-blue-100">
                  <CardTitle className="text-xl">{result.productName}</CardTitle>
                  <CardDescription>Complete product information</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Internal Inventory Data */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-600" />
                      Inventory & Stock
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="text-sm text-slate-600">Total Stock</div>
                        <div className="text-2xl font-bold text-slate-900">{result.stock}</div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="text-sm text-slate-600">In Transit</div>
                        <div className="text-2xl font-bold text-orange-600">{result.transit}</div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="text-sm text-slate-600">Kievyan Stock</div>
                        <div className="text-2xl font-bold text-green-600">{result.kievyanStock}</div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="text-sm text-slate-600">Sevan Stock</div>
                        <div className="text-2xl font-bold text-purple-600">{result.sevanStock}</div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Data */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      Pricing Information
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="text-sm text-slate-600">Retail Price USD</div>
                        <div className="text-xl font-bold text-slate-900">
                          {result.retailPriceUsd ? `$${result.retailPriceUsd.toFixed(2)}` : 'N/A'}
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="text-sm text-slate-600">Wholesale Price</div>
                        <div className="text-xl font-bold text-slate-900">
                          {result.wholesalePrice1 ? `$${result.wholesalePrice1.toFixed(2)}` : 'N/A'}
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="text-sm text-slate-600">Current Cost</div>
                        <div className="text-xl font-bold text-slate-900">
                          {result.currentCost ? `$${result.currentCost.toFixed(2)}` : 'N/A'}
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="text-sm text-slate-600">Last Purchase Price</div>
                        <div className="text-xl font-bold text-slate-900">
                          {result.lastPrice ? `$${result.lastPrice.toFixed(2)}` : 'N/A'}
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="text-sm text-slate-600">Avg Sale Price</div>
                        <div className="text-xl font-bold text-green-600">
                          {result.avgSalePrice ? `$${result.avgSalePrice.toFixed(2)}` : 'N/A'}
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="text-sm text-slate-600">Profit/Unit</div>
                        <div className="text-xl font-bold text-green-600">
                          {result.profitPerUnit ? `$${result.profitPerUnit.toFixed(2)}` : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sales Data */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      Sales Performance
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="text-sm text-slate-600">Sold (30d)</div>
                        <div className="text-xl font-bold text-slate-900">{result.sold30d}</div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="text-sm text-slate-600">Sold (60d)</div>
                        <div className="text-xl font-bold text-slate-900">{result.sold60d}</div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="text-sm text-slate-600">Sold (90d)</div>
                        <div className="text-xl font-bold text-slate-900">{result.sold90d}</div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="text-sm text-slate-600">Last Supplier</div>
                        <div className="text-sm font-semibold text-slate-900">
                          {result.lastSupplier || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Supplier Offers */}
                  {result.supplierOffers.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Truck className="h-5 w-5 text-orange-600" />
                        Supplier Offers ({result.supplierOffers.length})
                      </h3>
                      <div className="space-y-2">
                        {result.supplierOffers.map((offer, offerIndex) => (
                          <div key={offerIndex} className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <div className="text-xs text-slate-600">Supplier</div>
                                <div className="font-semibold text-slate-900">{offer.supplier}</div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-600">Price</div>
                                <div className="font-semibold text-slate-900">
                                  {offer.price} {offer.currency}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-600">Stock</div>
                                <div className="font-semibold text-slate-900">{offer.stock}</div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-600">Source</div>
                                <div className="text-xs font-semibold text-orange-600 uppercase">
                                  {offer.sourceType}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No Results */}
        {!isSearching && searchResults.length === 0 && searchQuery && (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No results found</h3>
              <p className="text-slate-600">
                Try searching with a different product name or keyword
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
