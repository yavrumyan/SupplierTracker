import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function CompStyleInventoryMovement() {
  // Mock data for demonstration
  const transferRecommendations = [
    {
      product: "AMD Ryzen 7 7800X3D",
      sku: "AMD-7800X3D-001",
      from: "Sevan 5",
      to: "Kievyan 11",
      qty: 5,
      reason: "High demand at retail location",
      priority: "High"
    },
    {
      product: "NVIDIA RTX 4070 Ti",
      sku: "NV-4070TI-002",
      from: "Kievyan 11",
      to: "Sevan 5",
      qty: 3,
      reason: "Excess inventory at retail",
      priority: "Medium"
    },
    {
      product: "Samsung 970 EVO Plus 1TB",
      sku: "SAM-970EP-1TB",
      from: "Sevan 5",
      to: "Kievyan 11",
      qty: 8,
      reason: "Stock out at retail",
      priority: "High"
    }
  ];

  const deadStock = [
    {
      product: "Intel Core i5-10400F",
      sku: "INT-I5-10400F",
      location: "Sevan 5",
      qty: 12,
      value: "$1,440",
      daysStagnant: 180
    },
    {
      product: "GTX 1660 Super",
      sku: "NV-1660S-001",
      location: "Kievyan 11",
      qty: 6,
      value: "$1,200",
      daysStagnant: 150
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Inventory Movement Analysis</h1>
          <p className="text-slate-600">
            Optimize stock distribution between Kievyan 11 and Sevan 5 locations
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transfer Recommendations</CardTitle>
              <ArrowRight className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{transferRecommendations.length}</div>
              <p className="text-xs text-slate-600">Active recommendations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dead Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{deadStock.length}</div>
              <p className="text-xs text-slate-600">Requiring action</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Optimization Potential</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">18%</div>
              <p className="text-xs text-slate-600">Efficiency improvement</p>
            </CardContent>
          </Card>
        </div>

        {/* Transfer Recommendations */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Transfer Recommendations</CardTitle>
            <CardDescription>
              Suggested inventory transfers to optimize stock distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transferRecommendations.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{item.product}</div>
                    <div className="text-sm text-slate-600">SKU: {item.sku}</div>
                    <div className="text-sm text-slate-600">{item.reason}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-sm font-medium">{item.from}</div>
                      <ArrowRight className="h-4 w-4 text-slate-400 mx-auto mt-1" />
                      <div className="text-sm font-medium">{item.to}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{item.qty}</div>
                      <div className="text-xs text-slate-600">units</div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs ${
                      item.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.priority}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dead Stock Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Dead Stock Analysis</CardTitle>
            <CardDescription>
              Products with low movement requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deadStock.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{item.product}</div>
                    <div className="text-sm text-slate-600">SKU: {item.sku}</div>
                    <div className="text-sm text-slate-600">Location: {item.location}</div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-lg font-bold">{item.qty}</div>
                      <div className="text-xs text-slate-600">units</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">{item.value}</div>
                      <div className="text-xs text-slate-600">locked value</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{item.daysStagnant}</div>
                      <div className="text-xs text-slate-600">days stagnant</div>
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