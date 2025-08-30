import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Package } from "lucide-react";
import { Link } from "wouter";

export default function CompStyleSalesAnalysis() {
  // Mock data for demonstration
  const topPerformers = [
    {
      product: "AMD Ryzen 7 7800X3D",
      sku: "AMD-7800X3D-001",
      unitsSold: 45,
      revenue: "$13,500",
      profit: "$4,050",
      margin: "30%"
    },
    {
      product: "NVIDIA RTX 4070 Ti",
      sku: "NV-4070TI-002",
      unitsSold: 32,
      revenue: "$25,600",
      profit: "$6,400",
      margin: "25%"
    },
    {
      product: "Samsung 970 EVO Plus 1TB",
      sku: "SAM-970EP-1TB",
      unitsSold: 78,
      revenue: "$7,800",
      profit: "$2,340",
      margin: "30%"
    }
  ];

  const locationComparison = [
    {
      location: "Kievyan 11",
      revenue: "$87,420",
      orders: 156,
      avgOrderValue: "$560",
      topCategory: "Graphics Cards"
    },
    {
      location: "Sevan 5",
      revenue: "$99,000",
      orders: 89,
      avgOrderValue: "$1,112",
      topCategory: "Processors"
    }
  ];

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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Sales Analysis</h1>
          <p className="text-slate-600">
            Performance tracking and sales insights across CompStyle locations
          </p>
        </div>

        {/* Period Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">$186,420</div>
              <p className="text-xs text-slate-600">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Units Sold</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">245</div>
              <p className="text-xs text-slate-600">Total units</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">$761</div>
              <p className="text-xs text-slate-600">+12% vs last period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">27.8%</div>
              <p className="text-xs text-slate-600">-2% vs last period</p>
            </CardContent>
          </Card>
        </div>

        {/* Location Comparison */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Location Performance Comparison</CardTitle>
            <CardDescription>
              Sales metrics by location for the current period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {locationComparison.map((location, index) => (
                <div key={index} className="p-6 bg-slate-50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">{location.location}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Revenue</span>
                      <span className="font-semibold">{location.revenue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Orders</span>
                      <span className="font-semibold">{location.orders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Avg Order Value</span>
                      <span className="font-semibold">{location.avgOrderValue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Top Category</span>
                      <span className="font-semibold">{location.topCategory}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Top Performing Products</CardTitle>
            <CardDescription>
              Best selling products by revenue and profit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{product.product}</div>
                    <div className="text-sm text-slate-600">SKU: {product.sku}</div>
                  </div>
                  <div className="grid grid-cols-4 gap-6 text-center">
                    <div>
                      <div className="font-bold">{product.unitsSold}</div>
                      <div className="text-xs text-slate-600">Units</div>
                    </div>
                    <div>
                      <div className="font-bold">{product.revenue}</div>
                      <div className="text-xs text-slate-600">Revenue</div>
                    </div>
                    <div>
                      <div className="font-bold">{product.profit}</div>
                      <div className="text-xs text-slate-600">Profit</div>
                    </div>
                    <div>
                      <div className="font-bold">{product.margin}</div>
                      <div className="text-xs text-slate-600">Margin</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recommended Actions</CardTitle>
              <CardDescription>Based on current analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Inventory Optimization</h4>
                <p className="text-sm text-slate-600">
                  Transfer 16 high-demand products from warehouse to retail location
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">Price Adjustment</h4>
                <p className="text-sm text-slate-600">
                  Consider promotional pricing for 18 slow-moving items
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Reorder Priority</h4>
                <p className="text-sm text-slate-600">
                  Fast-moving SKUs need immediate restocking
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Related Analysis</CardTitle>
              <CardDescription>Explore more insights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/compstyle/profitability">
                <Button className="w-full" variant="outline">
                  Profitability Reports
                </Button>
              </Link>
              <Link href="/compstyle/order-recommendations">
                <Button className="w-full" variant="outline">
                  Order Recommendations
                </Button>
              </Link>
              <div className="text-sm text-slate-600 mt-4">
                Use these tools to dive deeper into specific aspects of your business performance.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}