import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, BarChart3, TrendingUp, Package, AlertTriangle, DollarSign, Award } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface DashboardStats {
  totalInventory: number;
  stockHealth: number;
  businessHealthIndex: number;
  salesVolume30Days: number;
  salesVolumeScore?: number;
  profitabilityScore?: number;
  stockHealthScore?: number;
  inventoryHealthScore?: number;
}

export default function CompStyleDashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/compstyle/dashboard-stats"],
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">CompStyle Business Intelligence</h1>
          <p className="text-slate-600">
            Inventory optimization and sales analysis for CompStyle locations
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Business Health Index</CardTitle>
              <Award className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                isLoading ? 'text-slate-600' :
                (stats?.businessHealthIndex || 0) >= 90 ? 'text-green-600' :
                (stats?.businessHealthIndex || 0) >= 75 ? 'text-blue-600' :
                (stats?.businessHealthIndex || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {isLoading ? "..." : (stats?.businessHealthIndex || 0).toFixed(1)}
              </div>
              {!isLoading && stats && stats.salesVolumeScore !== undefined && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Sales Volume:</span>
                    <span className={`font-semibold ${
                      (stats.salesVolumeScore || 0) >= 80 ? 'text-green-600' :
                      (stats.salesVolumeScore || 0) >= 60 ? 'text-orange-500' : 'text-red-600'
                    }`}>
                      {(stats.salesVolumeScore || 0).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Profitability:</span>
                    <span className={`font-semibold ${
                      (stats.profitabilityScore || 0) >= 80 ? 'text-green-600' :
                      (stats.profitabilityScore || 0) >= 60 ? 'text-orange-500' : 'text-red-600'
                    }`}>
                      {(stats.profitabilityScore || 0).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Stock Health:</span>
                    <span className={`font-semibold ${
                      (stats.stockHealthScore || 0) >= 80 ? 'text-green-600' :
                      (stats.stockHealthScore || 0) >= 70 ? 'text-orange-500' : 'text-red-600'
                    }`}>
                      {(stats.stockHealthScore || 0).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Inventory Health:</span>
                    <span className={`font-semibold ${
                      (stats.inventoryHealthScore || 0) >= 80 ? 'text-green-600' :
                      (stats.inventoryHealthScore || 0) >= 60 ? 'text-orange-500' : 'text-red-600'
                    }`}>
                      {(stats.inventoryHealthScore || 0).toFixed(0)}%
                    </span>
                  </div>
                </div>
              )}
              {isLoading && (
                <p className="text-xs text-slate-600 mt-2">Calculating components...</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Health</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                isLoading ? 'text-slate-600' :
                (stats?.stockHealth || 0) > 80 ? 'text-green-600' :
                (stats?.stockHealth || 0) >= 70 ? 'text-orange-600' : 'text-red-600'
              }`}>
                {isLoading ? "..." : (stats?.stockHealth || 0).toFixed(1)}%
              </div>
              <p className="text-xs text-slate-600">Healthy inventory ratio</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inventory</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-800" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800">
                ${isLoading ? "..." : (stats?.totalInventory || 0).toLocaleString()}
              </div>
              <p className="text-xs text-slate-600">Stock + Transit value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">30 day Sales Volume</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-800" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-800">
                ${isLoading ? "..." : (stats?.salesVolume30Days || 0).toLocaleString()}
              </div>
              <p className="text-xs text-slate-600">Last 30 days total</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>
                Upload and manage CompStyle inventory and sales data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/compstyle/upload">
                <Button className="w-full" variant="outline">
                  Upload CSV Files
                </Button>
              </Link>
              <Link href="/compstyle/data-overview">
                <Button className="w-full" variant="outline">
                  View Data Overview
                </Button>
              </Link>
              <Link href="/compstyle/actual-product-prices">
                <Button className="w-full" variant="outline">
                  Actual Product Prices
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics & Reports
              </CardTitle>
              <CardDescription>
                Advanced business intelligence and optimization tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/compstyle/analytics-phase1">
                <Button className="w-full h-24 flex-col gap-2" variant="outline">
                  <TrendingUp className="h-6 w-6" />
                  <span className="font-semibold">Phase 1 Analytics</span>
                  <span className="text-xs text-slate-600">Sales Velocity & Stock-Out Risk</span>
                </Button>
              </Link>

              <Link href="/compstyle/analytics-phase2">
                <Button className="w-full h-24 flex-col gap-2" variant="outline">
                  <Award className="h-6 w-6" />
                  <span className="font-semibold">Phase 2: Strategic Insights</span>
                  <span className="text-xs text-slate-600">Supplier Performance & Order Engine</span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Feature Overview */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Available Features</CardTitle>
              <CardDescription>
                Comprehensive business intelligence tools for CompStyle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link href="/compstyle/inventory-movement">
                  <div className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors">
                    <h4 className="font-semibold mb-2">📊 Inventory Movement</h4>
                    <p className="text-sm text-slate-600">
                      Optimize stock distribution between Kievyan 11 and Sevan 5 locations
                    </p>
                  </div>
                </Link>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold mb-2">📈 Sales Analysis</h4>
                  <p className="text-sm text-slate-600">
                    Track performance trends across 1M, 3M, and 6M periods
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold mb-2">🛒 Order Recommendations</h4>
                  <p className="text-sm text-slate-600">
                    AI-driven purchase suggestions based on sales velocity
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold mb-2">💰 Profitability Reports</h4>
                  <p className="text-sm text-slate-600">
                    Analyze margins, ROI, and inventory efficiency
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold mb-2">🐌 Low Moving Stock</h4>
                  <p className="text-sm text-slate-600">
                    Identify dead stock and slow-moving inventory
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold mb-2">🚚 Transit Tracking</h4>
                  <p className="text-sm text-slate-600">
                    Monitor incoming inventory and plan accordingly
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}