import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Building2, ShoppingCart, RefreshCw, Download, Award, MapPin, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


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
  stock: number;
  transit: number;
  sold30d: number;
  sold60d: number;
  sold90d: number;
  sold120d: number;
  sold150d: number;
  sold180d: number;
  optimalOrderQty: number;
  lastSupplier: string;
  lastPrice: number;
  currentCost: number;
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

  const exportSupplierPerformance = () => {
    const timestamp = new Date().toISOString().split('T')[0];

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

      toast({
        title: "Export successful",
        description: "Supplier performance data exported",
      });
    }
  };

  const exportLocationOptimization = () => {
    const timestamp = new Date().toISOString().split('T')[0];

    if (locationOptimization) {
      // Export Location Performance Comparison
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

      // Export Kievyan Top Products
      if (locationOptimization.kievyan.topProducts.length > 0) {
        const kievyanHeaders = ['Product Name', 'Quantity Sold', 'Revenue'];
        const kievyanData = [kievyanHeaders];

        locationOptimization.kievyan.topProducts.forEach(p => {
          kievyanData.push([
            p.productName,
            p.qty.toString(),
            `$${p.revenue.toFixed(2)}`
          ]);
        });

        const kievyanContent = kievyanData.map(row => 
          row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n');

        const kievyanBlob = new Blob(['\ufeff' + kievyanContent], { type: 'text/csv;charset=utf-8;' });
        const kievyanLink = document.createElement('a');
        const kievyanUrl = URL.createObjectURL(kievyanBlob);
        kievyanLink.setAttribute('href', kievyanUrl);
        kievyanLink.setAttribute('download', `kievyan-top-products_${timestamp}.csv`);
        kievyanLink.style.visibility = 'hidden';
        document.body.appendChild(kievyanLink);
        kievyanLink.click();
        document.body.removeChild(kievyanLink);
        URL.revokeObjectURL(kievyanUrl);
      }

      // Export Sevan Top Products
      if (locationOptimization.sevan.topProducts.length > 0) {
        const sevanHeaders = ['Product Name', 'Quantity Sold', 'Revenue'];
        const sevanData = [sevanHeaders];

        locationOptimization.sevan.topProducts.forEach(p => {
          sevanData.push([
            p.productName,
            p.qty.toString(),
            `$${p.revenue.toFixed(2)}`
          ]);
        });

        const sevanContent = sevanData.map(row => 
          row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n');

        const sevanBlob = new Blob(['\ufeff' + sevanContent], { type: 'text/csv;charset=utf-8;' });
        const sevanLink = document.createElement('a');
        const sevanUrl = URL.createObjectURL(sevanBlob);
        sevanLink.setAttribute('href', sevanUrl);
        sevanLink.setAttribute('download', `sevan-top-products_${timestamp}.csv`);
        sevanLink.style.visibility = 'hidden';
        document.body.appendChild(sevanLink);
        sevanLink.click();
        document.body.removeChild(sevanLink);
        URL.revokeObjectURL(sevanUrl);
      }

      // Export Transfer Recommendations
      if (locationOptimization.transferRecommendations.length > 0) {
        const transferHeaders = ['Product', 'From Location', 'To Location', 'Quantity', 'Reason', 'Priority'];
        const transferData = [transferHeaders];

        locationOptimization.transferRecommendations.forEach(t => {
          transferData.push([
            t.productName,
            t.fromLocation,
            t.toLocation,
            t.qty.toString(),
            t.reason,
            t.priority.toUpperCase()
          ]);
        });

        const transferContent = transferData.map(row => 
          row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n');

        const transferBlob = new Blob(['\ufeff' + transferContent], { type: 'text/csv;charset=utf-8;' });
        const transferLink = document.createElement('a');
        const transferUrl = URL.createObjectURL(transferBlob);
        transferLink.setAttribute('href', transferUrl);
        transferLink.setAttribute('download', `stock-transfer-recommendations_${timestamp}.csv`);
        transferLink.style.visibility = 'hidden';
        document.body.appendChild(transferLink);
        transferLink.click();
        document.body.removeChild(transferLink);
        URL.revokeObjectURL(transferUrl);
      }

      toast({
        title: "Export successful",
        description: "Location optimization data exported",
      });
    }
  };

  const exportStockTransfers = () => {
    const timestamp = new Date().toISOString().split('T')[0];

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

      toast({
        title: "Export successful",
        description: "Stock transfer recommendations exported",
      });
    }
  };

  const exportOrderRecommendations = () => {
    const timestamp = new Date().toISOString().split('T')[0];

    if (filteredOrderRecommendations && filteredOrderRecommendations.length > 0) {
      const headers = ['Product', 'Stock', 'Transit', `Sold (${selectedSalesPeriod})`, 'Order Qty', 'Last Supplier', 'Last Price', 'Current Cost', 'Expected Profit', 'Margin %', 'Stock-Out Days', 'Priority Score', 'Priority', 'Sales Period', 'Transit Time'];
      const csvData = [headers];

      filteredOrderRecommendations.forEach(r => {
        csvData.push([
          r.productName,
          r.stock.toString(),
          r.transit.toString(),
          r.soldQty.toString(),
          r.calculatedOrderQty.toString(),
          r.lastSupplier,
          `$${r.lastPrice.toFixed(2)}`,
          `$${r.currentCost.toFixed(2)}`,
          `$${r.expectedProfit.toFixed(2)}`,
          `${r.profitMargin.toFixed(1)}%`,
          r.stockOutRisk < 999 ? r.stockOutRisk.toString() : '∞',
          r.priorityScore.toString(),
          r.priority.toUpperCase(),
          selectedSalesPeriod,
          `${transitLabels[selectedTransitTime]} (${transitMultipliers[selectedTransitTime]}x)`
        ]);
      });

      const csvContent = csvData.map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `order-recommendations_${selectedSalesPeriod}_${selectedTransitTime}_${timestamp}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: `Order recommendations exported with ${selectedSalesPeriod} sales and ${transitLabels[selectedTransitTime]} transit time`,
      });
    }
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

  // State for filters
  const [selectedSalesPeriod, setSelectedSalesPeriod] = useState('30d');
  const [selectedTransitTime, setSelectedTransitTime] = useState('4w');

  // Transit time multipliers
  const transitMultipliers: { [key: string]: number } = {
    '2w': 0.5,
    '3w': 0.75,
    '4w': 1.0,
    '5w': 1.25,
    '6w': 1.5,
    '8w': 2.0,
    '12w': 3.0
  };

  const transitLabels: { [key: string]: string } = {
    '2w': '2 weeks',
    '3w': '3 weeks',
    '4w': '4 weeks',
    '5w': '5 weeks',
    '6w': '6 weeks',
    '8w': '8 weeks',
    '12w': '12 weeks'
  };

  const filteredOrderRecommendations = orderRecommendations?.map(rec => {
    let soldQty = 0;
    switch (selectedSalesPeriod) {
      case '30d':
        soldQty = rec.sold30d;
        break;
      case '60d':
        soldQty = rec.sold60d;
        break;
      case '90d':
        soldQty = rec.sold90d;
        break;
      case '120d':
        soldQty = rec.sold120d;
        break;
      case '150d':
        soldQty = rec.sold150d;
        break;
      case '180d':
        soldQty = rec.sold180d;
        break;
      default:
        soldQty = rec.sold30d;
    }

    // Calculate Order Qty: (Sold [Selected Period] - Stock - Transit) × [Transit Time Multiplier]
    const multiplier = transitMultipliers[selectedTransitTime];
    const baseOrderQty = soldQty - rec.stock - rec.transit;
    const calculatedOrderQty = Math.max(0, Math.ceil(baseOrderQty * multiplier));

    return {
      ...rec,
      soldQty: soldQty,
      calculatedOrderQty: calculatedOrderQty,
    };
  });


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
            <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Supplier Performance Matrix */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  Supplier Performance Matrix
                </CardTitle>
                <CardDescription>
                  Price competitiveness, lead time, and overall performance scoring
                </CardDescription>
              </div>
              <Button onClick={exportSupplierPerformance} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-purple-600" />
                  Location Performance & Optimization
                </CardTitle>
                <CardDescription>
                  Compare Kievyan vs Sevan performance and stock transfer recommendations
                </CardDescription>
              </div>
              <Button onClick={exportLocationOptimization} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
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
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold">Stock Transfer Recommendations</h3>
                      <Button onClick={exportStockTransfers} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                  Intelligent Order Recommendations
                </CardTitle>
                <CardDescription>
                  Optimal quantities, best suppliers, and priority ranking based on profitability × urgency
                </CardDescription>
              </div>
              <Button onClick={exportOrderRecommendations} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingOrders ? (
              <div className="text-center py-8 text-slate-500">Loading order recommendations...</div>
            ) : !orderRecommendations || orderRecommendations.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No order recommendations available</div>
            ) : (
              <div className="space-y-4">
                {/* Filters */}
                <div className="p-4 bg-slate-100 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <label htmlFor="sales-period" className="text-sm font-medium">Sales Period:</label>
                      <Select value={selectedSalesPeriod} onValueChange={setSelectedSalesPeriod}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30d">30 Days</SelectItem>
                          <SelectItem value="60d">60 Days</SelectItem>
                          <SelectItem value="90d">90 Days</SelectItem>
                          <SelectItem value="120d">120 Days</SelectItem>
                          <SelectItem value="150d">150 Days</SelectItem>
                          <SelectItem value="180d">180 Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <label htmlFor="transit-time" className="text-sm font-medium">Transit Time:</label>
                      <Select value={selectedTransitTime} onValueChange={setSelectedTransitTime}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Select transit time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2w">2 weeks (×0.5)</SelectItem>
                          <SelectItem value="3w">3 weeks (×0.75)</SelectItem>
                          <SelectItem value="4w">4 weeks (×1.0)</SelectItem>
                          <SelectItem value="5w">5 weeks (×1.25)</SelectItem>
                          <SelectItem value="6w">6 weeks (×1.5)</SelectItem>
                          <SelectItem value="8w">8 weeks (×2.0)</SelectItem>
                          <SelectItem value="12w">12 weeks (×3.0)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Current Settings:</strong> Using <span className="font-semibold">Sold ({selectedSalesPeriod})</span> with <span className="font-semibold">{transitLabels[selectedTransitTime]}</span> transit time (multiplier: {transitMultipliers[selectedTransitTime]}×)
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="p-3 text-left">Product</th>
                        <th className="p-3 text-right">Stock</th>
                        <th className="p-3 text-right">Transit</th>
                        <th className="p-3 text-right">Sold ({selectedSalesPeriod})</th>
                        <th className="p-3 text-right">Order Qty</th>
                        <th className="p-3 text-left">Last Supplier</th>
                        <th className="p-3 text-right">Last Price</th>
                        <th className="p-3 text-right">Current Cost</th>
                        <th className="p-3 text-right">Expected Profit</th>
                        <th className="p-3 text-right">Margin %</th>
                        <th className="p-3 text-right">Days Left</th>
                        <th className="p-3 text-center">Priority</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrderRecommendations?.map((rec, index) => {
                        const soldQty = rec.soldQty;
                        const calculatedOrderQty = rec.calculatedOrderQty;
                        return (
                          <tr key={index} className={`border-b hover:bg-slate-50 ${
                            rec.priority === 'critical' ? 'bg-red-50' : ''
                          }`}>
                            <td className="p-3 font-medium max-w-xs truncate" title={rec.productName}>
                              {rec.productName}
                            </td>
                            <td className="p-3 text-right">{rec.stock}</td>
                            <td className="p-3 text-right">{rec.transit}</td>
                            <td className="p-3 text-right font-medium">{soldQty}</td>
                            <td className="p-3 text-right">
                              <span className="text-blue-600 font-bold">{calculatedOrderQty}</span>
                            </td>
                            <td className="p-3">{rec.lastSupplier}</td>
                            <td className="p-3 text-right">${rec.lastPrice.toFixed(2)}</td>
                            <td className="p-3 text-right">${rec.currentCost.toFixed(2)}</td>
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                  <div className="text-sm font-semibold mb-2">Calculation Logic:</div>
                  <p className="text-xs text-slate-600">
                    <strong>Order Qty:</strong> (Sold [Selected Period] - Stock - Transit) × [Transit Time Multiplier]
                    <br />
                    <strong>Last Supplier:</strong> Most recent supplier from procurement data
                    <br />
                    <strong>Last Price:</strong> Most recent purchase price
                    <br />
                    <strong>Current Cost:</strong> Product cost (or latest cost if unavailable)
                    <br />
                    <strong>Expected Profit:</strong> (Avg Sale Price - Current Cost) × Order Qty
                    <br />
                    <strong>Margin %:</strong> ((Avg Sale Price - Current Cost) / Current Cost) × 100
                    <br />
                    <strong>Priority Score:</strong> (Margin % × 0.6) + (Stock-Out Urgency × 0.4)
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