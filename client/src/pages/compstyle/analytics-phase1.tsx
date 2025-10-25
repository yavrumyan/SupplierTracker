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

  const isRefreshing = fetchingVelocity || fetchingRisk || fetchingDead;

  const handleRefresh = async () => {
    toast({
      title: "Refreshing analytics...",
      description: "Fetching the latest data",
    });

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["/api/compstyle/analytics/sales-velocity"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/compstyle/analytics/stock-out-risk"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/compstyle/analytics/dead-stock"] }),
    ]);

    // Wait a moment for queries to complete
    setTimeout(() => {
      toast({
        title: "Analytics refreshed",
        description: "All data has been updated successfully",
      });
    }, 1000);
  };

  const exportAllReports = () => {
    const timestamp = new Date().toISOString().split('T')[0];

    // Export Stock-Out Risk Analysis
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
    }

    // Export Dead Stock Analysis
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
    }

    // Export Top Sales Velocity
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
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
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
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Stock-Out Risk Analysis
            </CardTitle>
            <CardDescription>
              Products that need reordering based on sales velocity
            </CardDescription>
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
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-red-600" />
              Dead Stock Analysis
            </CardTitle>
            <CardDescription>
              Slow-moving products with high inventory levels
            </CardDescription>
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

        {/* Top Sales Velocity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Top Sales Velocity
            </CardTitle>
            <CardDescription>
              Fastest selling products by daily velocity
            </CardDescription>
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