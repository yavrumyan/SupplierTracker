
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Building2, ShoppingCart, RefreshCw, Download, Award, MapPin, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface SupplierPerformance {
  supplier: string;
  totalPurchases: number;
  avgPurchasePrice: number;
  priceCompetitiveness: number;
  avgLeadTimeDays: number;
  productsSupplied: number;
  performanceScore: number;
}

interface LocationOptimization {
  kievyan: {
    totalSales: number;
    totalRevenue: number;
    avgOrderValue: number;
    topProducts: Array<{productName: string; qty: number; revenue: number}>;
  };
  sevan: {
    totalSales: number;
    totalRevenue: number;
    avgOrderValue: number;
    topProducts: Array<{productName: string; qty: number; revenue: number}>;
  };
  transferRecommendations: Array<{
    productName: string;
    fromLocation: string;
    toLocation: string;
    qty: number;
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

interface OrderRecommendation {
  productName: string;
  optimalOrderQty: number;
  suggestedSupplier: string;
  supplierPrice: number;
  expectedProfit: number;
  profitMargin: number;
  stockOutRisk: number;
  priorityScore: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export default function CompStyleAnalyticsPhase2() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: supplierPerformance, isLoading: loadingSuppliers, isFetching: fetchingSuppliers } = useQuery<SupplierPerformance[]>({
    queryKey: ["/api/compstyle/analytics/supplier-performance"],
  });

  const { data: locationOptimization, isLoading: loadingLocation, isFetching: fetchingLocation } = useQuery<LocationOptimization>({
    queryKey: ["/api/compstyle/analytics/location-optimization"],
  });

  const { data: orderRecommendations, isLoading: loadingOrders, isFetching: fetchingOrders } = useQuery<OrderRecommendation[]>({
    queryKey: ["/api/compstyle/analytics/order-recommendations"],
  });

  const isRefreshing = fetchingSuppliers || fetchingLocation || fetchingOrders;

  const handleRefresh = async () => {
    toast({
      title: "Refreshing analytics...",
      description: "Fetching the latest strategic insights",
    });

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["/api/compstyle/analytics/supplier-performance"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/compstyle/analytics/location-optimization"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/compstyle/analytics/order-recommendations"] }),
    ]);

    setTimeout(() => {
      toast({
        title: "Analytics refreshed",
        description: "All strategic insights have been updated",
      });
    }, 1000);
  };

  const exportAllReports = () => {
    const timestamp = new Date().toISOString().split('T')[0];

    // Export Supplier Performance
    if (supplierPerformance && supplierPerformance.length > 0) {
      const headers = ['Supplier', 'Total Purchases', 'Avg Price', 'Price Score', 'Lead Time (days)', 'Products', 'Performance Score'];
      const csvData = [headers];

      supplierPerformance.forEach(s => {
        csvData.push([
          s.supplier,
          s.totalPurchases.toString(),
          `$${s.avgPurchasePrice.toFixed(2)}`,
          s.priceCompetitiveness.toString(),
          s.avgLeadTimeDays.toString(),
          s.productsSupplied.toString(),
          s.performanceScore.toString()
        ]);
      });

      const csvContent = csvData.map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `supplier-performance_${timestamp}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    // Export Location Performance Comparison
    if (locationOptimization) {
      const headers = ['Metric', 'Kievyan 11', 'Sevan 5'];
      const csvData = [headers];

      csvData.push(['Total Sales', locationOptimization.kievyan.totalSales.toString(), locationOptimization.sevan.totalSales.toString()]);
      csvData.push(['Total Revenue', `$${locationOptimization.kievyan.totalRevenue.toFixed(2)}`, `$${locationOptimization.sevan.totalRevenue.toFixed(2)}`]);
      csvData.push(['Avg Order Value', `$${locationOptimization.kievyan.avgOrderValue.toFixed(2)}`, `$${locationOptimization.sevan.avgOrderValue.toFixed(2)}`]);

      const csvContent = csvData.map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `location-performance-comparison_${timestamp}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    // Export Kievyan Top Products
    if (locationOptimization && locationOptimization.kievyan.topProducts.length > 0) {
      const headers = ['Product Name', 'Quantity Sold', 'Revenue'];
      const csvData = [headers];

      locationOptimization.kievyan.topProducts.forEach(p => {
        csvData.push([
          p.productName,
          p.qtySold.toString(),
          `$${p.revenue.toFixed(2)}`
        ]);
      });

      const csvContent = csvData.map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `kievyan-top-products_${timestamp}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    // Export Sevan Top Products
    if (locationOptimization && locationOptimization.sevan.topProducts.length > 0) {
      const headers = ['Product Name', 'Quantity Sold', 'Revenue'];
      const csvData = [headers];

      locationOptimization.sevan.topProducts.forEach(p => {
        csvData.push([
          p.productName,
          p.qtySold.toString(),
          `$${p.revenue.toFixed(2)}`
        ]);
      });

      const csvContent = csvData.map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `sevan-top-products_${timestamp}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    // Export Transfer Recommendations
    if (locationOptimization && locationOptimization.transferRecommendations.length > 0) {
      const headers = ['Product', 'From Location', 'To Location', 'Quantity', 'Reason', 'Priority'];
      const csvData = [headers];

      locationOptimization.transferRecommendations.forEach(t => {
        csvData.push([
          t.productName,
          t.fromLocation,
          t.toLocation,
          t.qty.toString(),
          t.reason,
          t.priority.toUpperCase()
        ]);
      });

      const csvContent = csvData.map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `stock-transfer-recommendations_${timestamp}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    // Export Order Recommendations
    if (orderRecommendations && orderRecommendations.length > 0) {
      const headers = ['Product', 'Order Qty', 'Supplier', 'Price', 'Expected Profit', 'Margin %', 'Stock-Out Days', 'Priority Score', 'Priority'];
      const csvData = [headers];

      orderRecommendations.forEach(r => {
        csvData.push([
          r.productName,
          r.optimalOrderQty.toString(),
          r.suggestedSupplier,
          `$${r.supplierPrice.toFixed(2)}`,
          `$${r.expectedProfit.toFixed(2)}`,
          `${r.profitMargin.toFixed(1)}%`,
          r.stockOutRisk < 999 ? r.stockOutRisk.toString() : '∞',
          r.priorityScore.toString(),
          r.priority.toUpperCase()
        ]);
      });

      const csvContent = csvData.map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `order-recommendations_${timestamp}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    toast({
      title: "Reports exported",
      description: "All Phase 2 analytics reports have been downloaded as CSV files",
    });
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      default: return 'bg-blue-500 text-white';
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
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Phase 2: Strategic Insights</h1>
              <p className="text-slate-600">
                Supplier performance, location optimization, and intelligent order recommendations
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={exportAllReports} variant="default">
                <Download className="h-4 w-4 mr-2" />
                Export Reports
              </Button>
              <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline">
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </div>

        {/* Supplier Performance Matrix */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-600" />
              Supplier Performance Matrix
            </CardTitle>
            <CardDescription>
              Price competitiveness, lead time, and overall performance scoring
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSuppliers ? (
              <div className="text-center py-8 text-slate-500">Loading supplier performance...</div>
            ) : !supplierPerformance || supplierPerformance.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No supplier data available</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-3 text-left">Supplier</th>
                      <th className="p-3 text-right">Total Purchases</th>
                      <th className="p-3 text-right">Avg Price</th>
                      <th className="p-3 text-right">Price Score</th>
                      <th className="p-3 text-right">Lead Time</th>
                      <th className="p-3 text-right">Products</th>
                      <th className="p-3 text-center">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplierPerformance.map((supplier, index) => (
                      <tr key={index} className="border-b hover:bg-slate-50">
                        <td className="p-3 font-medium">{supplier.supplier}</td>
                        <td className="p-3 text-right">{supplier.totalPurchases}</td>
                        <td className="p-3 text-right">${supplier.avgPurchasePrice.toFixed(2)}</td>
                        <td className="p-3 text-right">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${getPerformanceColor(supplier.priceCompetitiveness)}`}>
                            {supplier.priceCompetitiveness.toFixed(0)}
                          </span>
                        </td>
                        <td className="p-3 text-right">{supplier.avgLeadTimeDays.toFixed(1)} days</td>
                        <td className="p-3 text-right">{supplier.productsSupplied}</td>
                        <td className="p-3 text-center">
                          <span className={`px-3 py-1 rounded font-bold ${getPerformanceColor(supplier.performanceScore)}`}>
                            {supplier.performanceScore.toFixed(0)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location Optimization */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-purple-600" />
              Location Performance & Optimization
            </CardTitle>
            <CardDescription>
              Compare Kievyan vs Sevan performance and stock transfer recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingLocation ? (
              <div className="text-center py-8 text-slate-500">Loading location data...</div>
            ) : !locationOptimization ? (
              <div className="text-center py-8 text-slate-500">No location data available</div>
            ) : (
              <div className="space-y-6">
                {/* Location Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Kievyan 11 (Retail)
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Total Sales:</span>
                        <span className="font-semibold">{locationOptimization.kievyan.totalSales}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Revenue:</span>
                        <span className="font-semibold text-green-600">${locationOptimization.kievyan.totalRevenue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Avg Order Value:</span>
                        <span className="font-semibold">${locationOptimization.kievyan.avgOrderValue.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold mb-2">Top Products:</h4>
                      <div className="space-y-1">
                        {locationOptimization.kievyan.topProducts.slice(0, 5).map((p, i) => (
                          <div key={i} className="text-xs flex justify-between">
                            <span className="truncate max-w-[200px]">{p.productName}</span>
                            <span className="font-semibold">{p.qty} units</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-purple-50 rounded-lg border border-purple-200">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Sevan 5 (Warehouse)
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Total Sales:</span>
                        <span className="font-semibold">{locationOptimization.sevan.totalSales}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Revenue:</span>
                        <span className="font-semibold text-green-600">${locationOptimization.sevan.totalRevenue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Avg Order Value:</span>
                        <span className="font-semibold">${locationOptimization.sevan.avgOrderValue.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold mb-2">Top Products:</h4>
                      <div className="space-y-1">
                        {locationOptimization.sevan.topProducts.slice(0, 5).map((p, i) => (
                          <div key={i} className="text-xs flex justify-between">
                            <span className="truncate max-w-[200px]">{p.productName}</span>
                            <span className="font-semibold">{p.qty} units</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transfer Recommendations */}
                {locationOptimization.transferRecommendations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Stock Transfer Recommendations</h3>
                    <div className="space-y-3">
                      {locationOptimization.transferRecommendations.slice(0, 10).map((transfer, index) => (
                        <div key={index} className={`p-4 rounded-lg border ${
                          transfer.priority === 'high' ? 'bg-orange-50 border-orange-200' : 'bg-slate-50'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium">{transfer.productName}</div>
                              <div className="text-sm text-slate-600">{transfer.reason}</div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-center">
                                <div className="text-sm font-medium">{transfer.fromLocation}</div>
                                <ArrowRight className="h-4 w-4 mx-auto text-slate-400 my-1" />
                                <div className="text-sm font-medium">{transfer.toLocation}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-blue-600">{transfer.qty}</div>
                                <div className="text-xs text-slate-600">units</div>
                              </div>
                              <div className={`px-3 py-1 rounded text-xs font-semibold ${
                                transfer.priority === 'high' ? 'bg-orange-500 text-white' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {transfer.priority.toUpperCase()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Recommendations Engine */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-green-600" />
              Intelligent Order Recommendations
            </CardTitle>
            <CardDescription>
              Optimal quantities, best suppliers, and priority ranking based on profitability × urgency
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingOrders ? (
              <div className="text-center py-8 text-slate-500">Loading order recommendations...</div>
            ) : !orderRecommendations || orderRecommendations.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No order recommendations available</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-3 text-left">Product</th>
                      <th className="p-3 text-right">Order Qty</th>
                      <th className="p-3 text-left">Supplier</th>
                      <th className="p-3 text-right">Price</th>
                      <th className="p-3 text-right">Expected Profit</th>
                      <th className="p-3 text-right">Margin</th>
                      <th className="p-3 text-right">Days Left</th>
                      <th className="p-3 text-center">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderRecommendations.slice(0, 20).map((rec, index) => (
                      <tr key={index} className={`border-b hover:bg-slate-50 ${
                        rec.priority === 'critical' ? 'bg-red-50' : ''
                      }`}>
                        <td className="p-3 font-medium max-w-xs truncate" title={rec.productName}>
                          {rec.productName}
                        </td>
                        <td className="p-3 text-right font-bold text-blue-600">{rec.optimalOrderQty}</td>
                        <td className="p-3">{rec.suggestedSupplier}</td>
                        <td className="p-3 text-right">${rec.supplierPrice.toFixed(2)}</td>
                        <td className="p-3 text-right font-semibold text-green-600">
                          ${rec.expectedProfit.toFixed(2)}
                        </td>
                        <td className="p-3 text-right">{rec.profitMargin.toFixed(1)}%</td>
                        <td className="p-3 text-right">
                          <span className={`font-semibold ${
                            rec.stockOutRisk <= 7 ? 'text-red-600' : 
                            rec.stockOutRisk <= 14 ? 'text-orange-600' : 'text-slate-600'
                          }`}>
                            {rec.stockOutRisk < 999 ? rec.stockOutRisk : '∞'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-3 py-1 rounded text-xs font-semibold ${getPriorityColor(rec.priority)}`}>
                            {rec.priority.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                  <div className="text-sm font-semibold mb-2">Priority Calculation:</div>
                  <p className="text-xs text-slate-600">
                    Priority Score = (Profit Margin × 0.6) + (Stock-Out Urgency × 0.4)
                    <br />
                    Recommendations sorted by highest priority score (profitability × urgency)
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
