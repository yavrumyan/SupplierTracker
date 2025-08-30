import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart, AlertTriangle, TrendingUp, Package } from "lucide-react";
import { Link } from "wouter";

export default function CompStyleOrderRecommendations() {
  // Mock data for demonstration
  const orderRecommendations = [
    {
      product: "AMD Ryzen 7 7800X3D",
      sku: "AMD-7800X3D-001",
      currentStock: 3,
      recommendedOrder: 20,
      daysUntilStockout: 12,
      averageMonthlySales: 15,
      profitMargin: "30%",
      priority: "High"
    },
    {
      product: "NVIDIA RTX 4070 Ti",
      sku: "NV-4070TI-002",
      currentStock: 8,
      recommendedOrder: 15,
      daysUntilStockout: 25,
      averageMonthlySales: 10,
      profitMargin: "25%",
      priority: "Medium"
    },
    {
      product: "Samsung 970 EVO Plus 1TB",
      sku: "SAM-970EP-1TB",
      currentStock: 5,
      recommendedOrder: 30,
      daysUntilStockout: 8,
      averageMonthlySales: 20,
      profitMargin: "30%",
      priority: "High"
    },
    {
      product: "Corsair DDR5-5600 32GB",
      sku: "COR-DDR5-32GB",
      currentStock: 12,
      recommendedOrder: 25,
      daysUntilStockout: 30,
      averageMonthlySales: 12,
      profitMargin: "22%",
      priority: "Medium"
    }
  ];

  const urgentReorders = orderRecommendations.filter(item => item.priority === "High");
  const totalRecommendedValue = orderRecommendations.reduce((sum, item) => sum + (item.recommendedOrder * 300), 0); // Estimated avg cost

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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Order Recommendations</h1>
          <p className="text-slate-600">
            AI-driven purchase suggestions based on sales velocity and stock levels
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products to Order</CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{orderRecommendations.length}</div>
              <p className="text-xs text-slate-600">Recommended items</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Urgent Reorders</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{urgentReorders.length}</div>
              <p className="text-xs text-slate-600">High priority items</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Est. Order Value</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${totalRecommendedValue.toLocaleString()}</div>
              <p className="text-xs text-slate-600">Total investment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expected ROI</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">32%</div>
              <p className="text-xs text-slate-600">Based on margins</p>
            </CardContent>
          </Card>
        </div>

        {/* Urgent Orders */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Urgent Reorders
            </CardTitle>
            <CardDescription>
              Products requiring immediate ordering to prevent stockouts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {urgentReorders.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex-1">
                    <div className="font-medium">{item.product}</div>
                    <div className="text-sm text-slate-600">SKU: {item.sku}</div>
                    <div className="text-sm text-red-600">Stock out in {item.daysUntilStockout} days</div>
                  </div>
                  <div className="grid grid-cols-4 gap-6 text-center">
                    <div>
                      <div className="font-bold text-red-600">{item.currentStock}</div>
                      <div className="text-xs text-slate-600">Current</div>
                    </div>
                    <div>
                      <div className="font-bold text-blue-600">{item.recommendedOrder}</div>
                      <div className="text-xs text-slate-600">Order Qty</div>
                    </div>
                    <div>
                      <div className="font-bold">{item.averageMonthlySales}</div>
                      <div className="text-xs text-slate-600">Monthly Sales</div>
                    </div>
                    <div>
                      <div className="font-bold text-green-600">{item.profitMargin}</div>
                      <div className="text-xs text-slate-600">Margin</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* All Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>All Order Recommendations</CardTitle>
            <CardDescription>
              Complete list of recommended purchases based on sales data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orderRecommendations.map((item, index) => (
                <div key={index} className={`flex items-center justify-between p-4 rounded-lg ${
                  item.priority === 'High' ? 'bg-red-50 border border-red-200' : 'bg-slate-50'
                }`}>
                  <div className="flex-1">
                    <div className="font-medium">{item.product}</div>
                    <div className="text-sm text-slate-600">SKU: {item.sku}</div>
                    <div className="text-sm text-slate-600">
                      Stock out in {item.daysUntilStockout} days
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-4 text-center">
                    <div>
                      <div className="font-bold">{item.currentStock}</div>
                      <div className="text-xs text-slate-600">Current</div>
                    </div>
                    <div>
                      <div className="font-bold text-blue-600">{item.recommendedOrder}</div>
                      <div className="text-xs text-slate-600">Order</div>
                    </div>
                    <div>
                      <div className="font-bold">{item.averageMonthlySales}</div>
                      <div className="text-xs text-slate-600">Monthly Sales</div>
                    </div>
                    <div>
                      <div className="font-bold text-green-600">{item.profitMargin}</div>
                      <div className="text-xs text-slate-600">Margin</div>
                    </div>
                    <div>
                      <div className={`px-2 py-1 rounded text-xs ${
                        item.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.priority}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}