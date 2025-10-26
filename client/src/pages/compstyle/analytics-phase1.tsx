import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, AlertTriangle, Package, Clock, RefreshCw, Download } from "lucide-react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface SalesVelocity {
  productName: string;
  qtySold: number;
  salesPeriodDays: number;
  dailyVelocity: number;
  weeklyVelocity: number;
  monthlyVelocity: number;
}

interface StockOutRisk {
  productName: string;
  currentStock: number;
  inTransit: number;
  totalAvailable: number;
  dailyVelocity: number;
  daysUntilStockOut: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  recommendedOrder: number;
}

interface DeadStock {
  productName: string;
  currentStock: number;
  inTransit: number;
  totalInventory: number;
  qtySoldLast30Days: number;
  dailyVelocity: number;
  daysOfInventory: number | string; // Changed to allow string for "long time ago"
  lockedValue: number;
  recommendation: string;
}

interface ProfitabilityHeatMap {
  productName: string;
  retailPriceUsd: number;
  cost: number;
  profitPerUnit: number;
  profitMargin: number;
  qtySold: number;
  totalProfit: number;
  totalStock: number;
  potentialProfit: number;
  marginLevel: 'excellent' | 'good' | 'low' | 'negative';
  urgentRefill: boolean;
  daysUntilStockOut: number;
}

export default function CompStyleAnalyticsPhase1() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: salesVelocity, isLoading: loadingVelocity, isFetching: fetchingVelocity } = useQuery<SalesVelocity[]>({
    queryKey: ["/api/compstyle/analytics/sales-velocity"],
  });

  const { data: stockOutRisk, isLoading: loadingRisk, isFetching: fetchingRisk } = useQuery<StockOutRisk[]>({
    queryKey: ["/api/compstyle/analytics/stock-out-risk"],
  });

  const { data: deadStock, isLoading: loadingDead, isFetching: fetchingDead } = useQuery<DeadStock[]>({
    queryKey: ["/api/compstyle/analytics/dead-stock"],
  });

  const { data: profitabilityHeatMap, isLoading: loadingProfitability, isFetching: fetchingProfitability } = useQuery<ProfitabilityHeatMap[]>({
    queryKey: ["/api/compstyle/analytics/profitability-heat-map"],
  });

  const isRefreshing = fetchingVelocity || fetchingRisk || fetchingDead || fetchingProfitability;

  const handleRefresh = async () => {
    toast({
      title: "Refreshing analytics...",
      description: "Fetching the latest data",
    });

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["/api/compstyle/analytics/sales-velocity"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/compstyle/analytics/stock-out-risk"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/compstyle/analytics/dead-stock"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/compstyle/analytics/profitability-heat-map"] }),
    ]);

    // Wait a moment for queries to complete
    setTimeout(() => {
      toast({
        title: "Analytics refreshed",
        description: "All data has been updated successfully",
      });
    }, 1000);
  };

  const exportStockOutRisk = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    
    if (stockOutRisk && stockOutRisk.length > 0) {
      const headers1 = ['Product', 'Risk Level', 'Current Stock', 'In Transit', 'Total Available', 'Daily Sales', 'Days Until Stock Out', 'Recommended Order'];
      const csvData1 = [headers1];

      stockOutRisk.forEach(item => {
        csvData1.push([
          item.productName,
          item.riskLevel.toUpperCase(),
          item.currentStock.toString(),
          item.inTransit.toString(),
          item.totalAvailable.toString(),
          item.dailyVelocity.toString(),
          item.daysUntilStockOut < 999 ? item.daysUntilStockOut.toString() : '∞',
          item.recommendedOrder.toString()
        ]);
      });

      const csvContent1 = csvData1.map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const blob1 = new Blob(['\ufeff' + csvContent1], { type: 'text/csv;charset=utf-8;' });
      const link1 = document.createElement('a');
      const url1 = URL.createObjectURL(blob1);
      link1.setAttribute('href', url1);
      link1.setAttribute('download', `stock-out-risk-analysis_${timestamp}.csv`);
      link1.style.visibility = 'hidden';
      document.body.appendChild(link1);
      link1.click();
      document.body.removeChild(link1);
      URL.revokeObjectURL(url1);

      toast({
        title: "Export successful",
        description: "Stock-out risk analysis exported",
      });
    }
  };

  const exportDeadStock = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    
    if (deadStock && deadStock.length > 0) {
      const headers2 = ['Product', 'Total Inventory', 'Sold (30d)', 'Daily Sales', 'Days of Stock', 'Locked Value', 'Recommendation'];
      const csvData2 = [headers2];

      deadStock.forEach(item => {
        csvData2.push([
          item.productName,
          item.totalInventory.toString(),
          item.qtySoldLast30Days.toString(),
          item.dailyVelocity.toString(),
          typeof item.daysOfInventory === 'string' ? item.daysOfInventory : item.daysOfInventory.toString(), // Handle string or number
          `$${item.lockedValue.toFixed(2)}`,
          item.recommendation
        ]);
      });

      const csvContent2 = csvData2.map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const blob2 = new Blob(['\ufeff' + csvContent2], { type: 'text/csv;charset=utf-8;' });
      const link2 = document.createElement('a');
      const url2 = URL.createObjectURL(blob2);
      link2.setAttribute('href', url2);
      link2.setAttribute('download', `dead-stock-analysis_${timestamp}.csv`);
      link2.style.visibility = 'hidden';
      document.body.appendChild(link2);
      link2.click();
      document.body.removeChild(link2);
      URL.revokeObjectURL(url2);

      toast({
        title: "Export successful",
        description: "Dead stock analysis exported",
      });
    }
  };

  const exportSalesVelocity = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    
    if (salesVelocity && salesVelocity.length > 0) {
      const headers3 = ['Product', 'Total Sold', 'Daily Velocity', 'Weekly Velocity', 'Monthly Velocity'];
      const csvData3 = [headers3];

      salesVelocity.forEach(item => {
        csvData3.push([
          item.productName,
          item.qtySold.toString(),
          item.dailyVelocity.toString(),
          item.weeklyVelocity.toString(),
          item.monthlyVelocity.toString()
        ]);
      });

      const csvContent3 = csvData3.map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const blob3 = new Blob(['\ufeff' + csvContent3], { type: 'text/csv;charset=utf-8;' });
      const link3 = document.createElement('a');
      const url3 = URL.createObjectURL(blob3);
      link3.setAttribute('href', url3);
      link3.setAttribute('download', `top-sales-velocity_${timestamp}.csv`);
      link3.style.visibility = 'hidden';
      document.body.appendChild(link3);
      link3.click();
      document.body.removeChild(link3);
      URL.revokeObjectURL(url3);

      toast({
        title: "Export successful",
        description: "Top sales velocity exported",
      });
    }
  };

  const exportProfitability = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    
    if (profitabilityHeatMap && profitabilityHeatMap.length > 0) {
      const headers4 = ['Product', 'Avg Sale Price', 'Avg Cost', 'Profit/Unit', 'Margin %', 'Qty Sold', 'Total Profit', 'Stock', 'Days Left', 'Urgent Refill', 'Status'];
      const csvData4 = [headers4];

      profitabilityHeatMap.forEach(item => {
        csvData4.push([
          item.productName,
          `$${item.retailPriceUsd.toFixed(2)}`,
          `$${item.cost.toFixed(2)}`,
          `$${item.profitPerUnit.toFixed(2)}`,
          `${item.profitMargin.toFixed(1)}%`,
          item.qtySold.toString(),
          `$${item.totalProfit.toFixed(2)}`,
          item.totalStock.toString(),
          item.daysUntilStockOut < 999 ? item.daysUntilStockOut.toString() : '∞',
          item.urgentRefill ? 'URGENT' : 'OK',
          item.marginLevel.toUpperCase()
        ]);
      });

      const csvContent4 = csvData4.map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const blob4 = new Blob(['\ufeff' + csvContent4], { type: 'text/csv;charset=utf-8;' });
      const link4 = document.createElement('a');
      const url4 = URL.createObjectURL(blob4);
      link4.setAttribute('href', url4);
      link4.setAttribute('download', `profitability-heat-map_${timestamp}.csv`);
      link4.style.visibility = 'hidden';
      document.body.appendChild(link4);
      link4.click();
      document.body.removeChild(link4);
      URL.revokeObjectURL(url4);

      toast({
        title: "Export successful",
        description: "Profitability heat map exported",
      });
    }
  };

  const exportAllReports = () => {
    exportStockOutRisk();
    exportDeadStock();
    exportSalesVelocity();
    exportProfitability();
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  const getMarginColor = (level: string) => {
    switch (level) {
      case 'excellent': return 'bg-green-500 text-white';
      case 'good': return 'bg-blue-500 text-white';
      case 'low': return 'bg-yellow-500 text-white';
      case 'negative': return 'bg-red-500 text-white';
      default: return 'bg-gray-400 text-white';
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
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Phase 1 Analytics</h1>
              <p className="text-slate-600">
                Sales velocity, stock-out risk, and dead stock identification
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={exportAllReports}
                variant="default"
              >
                <Download className="h-4 w-4 mr-2" />
                Export All Reports
              </Button>
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh Analytics'}
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products at Risk</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {loadingRisk ? "..." : stockOutRisk?.length || 0}
              </div>
              <p className="text-xs text-slate-600">Need immediate attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dead Stock Items</CardTitle>
              <Package className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {loadingDead ? "..." : deadStock?.length || 0}
              </div>
              <p className="text-xs text-slate-600">Slow moving inventory</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Locked Value</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ${loadingDead ? "..." : deadStock?.reduce((sum, item) => sum + item.lockedValue, 0).toLocaleString(undefined, {maximumFractionDigits: 0}) || 0}
              </div>
              <p className="text-xs text-slate-600">In dead stock</p>
            </CardContent>
          </Card>
        </div>

        {/* Stock-Out Risk Analysis */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Stock-Out Risk Analysis
                </CardTitle>
                <CardDescription>
                  Products that need reordering based on sales velocity
                </CardDescription>
              </div>
              <Button onClick={exportStockOutRisk} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingRisk ? (
              <div className="text-center py-8 text-slate-500">Loading risk analysis...</div>
            ) : !stockOutRisk || stockOutRisk.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No products at risk</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-3 text-left">Product</th>
                      <th className="p-3 text-center">Risk</th>
                      <th className="p-3 text-right">Stock</th>
                      <th className="p-3 text-right">Transit</th>
                      <th className="p-3 text-right">Total</th>
                      <th className="p-3 text-right">Daily Sales</th>
                      <th className="p-3 text-right">Days Left</th>
                      <th className="p-3 text-right">Order Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockOutRisk.slice(0, 20).map((item, index) => (
                      <tr key={index} className="border-b hover:bg-slate-50">
                        <td className="p-3 font-medium max-w-xs truncate" title={item.productName}>
                          {item.productName}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${getRiskColor(item.riskLevel)}`}>
                            {item.riskLevel.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-right">{item.currentStock}</td>
                        <td className="p-3 text-right">{item.inTransit}</td>
                        <td className="p-3 text-right font-semibold">{item.totalAvailable}</td>
                        <td className="p-3 text-right">{item.dailyVelocity}</td>
                        <td className="p-3 text-right font-semibold">
                          {item.daysUntilStockOut < 999 ? item.daysUntilStockOut : '∞'}
                        </td>
                        <td className="p-3 text-right text-blue-600 font-semibold">
                          {item.recommendedOrder}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dead Stock Analysis */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-red-600" />
                  Dead Stock Analysis
                </CardTitle>
                <CardDescription>
                  Slow-moving products with high inventory levels
                </CardDescription>
              </div>
              <Button onClick={exportDeadStock} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingDead ? (
              <div className="text-center py-8 text-slate-500">Loading dead stock analysis...</div>
            ) : !deadStock || deadStock.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No dead stock identified</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-3 text-left">Product</th>
                      <th className="p-3 text-right">Total Inventory</th>
                      <th className="p-3 text-right">Sold (30d)</th>
                      <th className="p-3 text-right">Daily Sales</th>
                      <th className="p-3 text-right">Days of Stock</th>
                      <th className="p-3 text-right">Locked Value</th>
                      <th className="p-3 text-left">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deadStock.slice(0, 20).map((item, index) => (
                      <tr key={index} className="border-b hover:bg-slate-50">
                        <td className="p-3 font-medium max-w-xs truncate" title={item.productName}>
                          {item.productName}
                        </td>
                        <td className="p-3 text-right font-semibold">{item.totalInventory}</td>
                        <td className="p-3 text-right">{item.qtySoldLast30Days}</td>
                        <td className="p-3 text-right">{item.dailyVelocity}</td>
                        <td className="p-3 text-right">
                          <span className={`font-semibold ${
                            typeof item.daysOfInventory === 'string' 
                              ? 'text-red-600' 
                              : item.daysOfInventory > 180 
                                ? 'text-red-600' 
                                : item.daysOfInventory > 90 
                                  ? 'text-orange-600' 
                                  : 'text-yellow-600'
                          }`}>
                            {item.daysOfInventory}
                          </span>
                        </td>
                        <td className="p-3 text-right text-red-600 font-semibold">
                          ${item.lockedValue.toFixed(2)}
                        </td>
                        <td className="p-3 text-xs text-slate-600">{item.recommendation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profitability Heat Map */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Profitability Heat Map
                </CardTitle>
                <CardDescription>
                  Based on actual sales data - real profit margins and performance
                </CardDescription>
              </div>
              <Button onClick={exportProfitability} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingProfitability ? (
              <div className="text-center py-8 text-slate-500">Loading profitability analysis...</div>
            ) : !profitabilityHeatMap || profitabilityHeatMap.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No profitability data available</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-3 text-left">Product</th>
                      <th className="p-3 text-right">Avg Sale Price</th>
                      <th className="p-3 text-right">Avg Cost</th>
                      <th className="p-3 text-right">Profit/Unit</th>
                      <th className="p-3 text-right">Margin %</th>
                      <th className="p-3 text-right">Total Profit</th>
                      <th className="p-3 text-right">Stock</th>
                      <th className="p-3 text-center">Urgent Refill</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profitabilityHeatMap.slice(0, 20).map((item, index) => (
                      <tr key={index} className="border-b hover:bg-slate-50">
                        <td className="p-3 font-medium max-w-xs truncate" title={item.productName}>
                          {item.productName}
                        </td>
                        <td className="p-3 text-right">${item.retailPriceUsd.toFixed(2)}</td>
                        <td className="p-3 text-right">${item.cost.toFixed(2)}</td>
                        <td className="p-3 text-right font-semibold">
                          <span className={item.profitPerUnit >= 0 ? 'text-green-600' : 'text-red-600'}>
                            ${item.profitPerUnit.toFixed(2)}
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold">
                          <span className={getMarginColor(item.marginLevel).includes('green') ? 'text-green-600' : 
                                         getMarginColor(item.marginLevel).includes('blue') ? 'text-blue-600' :
                                         getMarginColor(item.marginLevel).includes('yellow') ? 'text-yellow-600' : 'text-red-600'}>
                            {item.profitMargin.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3 text-right font-semibold text-green-600">
                          ${item.totalProfit.toFixed(2)}
                        </td>
                        <td className="p-3 text-right">
                          {item.totalStock}
                          {item.daysUntilStockOut < 999 && (
                            <div className="text-xs text-slate-500">
                              ({item.daysUntilStockOut}d left)
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {item.urgentRefill ? (
                            <span className="px-3 py-1 rounded text-xs font-semibold bg-red-500 text-white animate-pulse">
                              ⚠️ URGENT
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-3 py-1 rounded text-xs font-semibold ${getMarginColor(item.marginLevel)}`}>
                            {item.marginLevel.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                  <div className="text-sm font-semibold mb-2">Margin Legend:</div>
                  <div className="flex flex-wrap gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded bg-green-500 text-white font-semibold">EXCELLENT</span>
                      <span className="text-slate-600">30%+ margin</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded bg-blue-500 text-white font-semibold">GOOD</span>
                      <span className="text-slate-600">15-30% margin</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded bg-yellow-500 text-white font-semibold">LOW</span>
                      <span className="text-slate-600">0-15% margin</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded bg-red-500 text-white font-semibold">NEGATIVE</span>
                      <span className="text-slate-600">Loss-making</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Sales Velocity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Top Sales Velocity
                </CardTitle>
                <CardDescription>
                  Fastest selling products by daily velocity
                </CardDescription>
              </div>
              <Button onClick={exportSalesVelocity} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingVelocity ? (
              <div className="text-center py-8 text-slate-500">Loading sales velocity...</div>
            ) : !salesVelocity || salesVelocity.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No sales data available</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-3 text-left">Product</th>
                      <th className="p-3 text-right">Total Sold</th>
                      <th className="p-3 text-right">Daily</th>
                      <th className="p-3 text-right">Weekly</th>
                      <th className="p-3 text-right">Monthly</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesVelocity.slice(0, 20).map((item, index) => (
                      <tr key={index} className="border-b hover:bg-slate-50">
                        <td className="p-3 font-medium max-w-xs truncate" title={item.productName}>
                          {item.productName}
                        </td>
                        <td className="p-3 text-right font-semibold">{item.qtySold}</td>
                        <td className="p-3 text-right text-green-600 font-semibold">{item.dailyVelocity}</td>
                        <td className="p-3 text-right">{item.weeklyVelocity}</td>
                        <td className="p-3 text-right">{item.monthlyVelocity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}