import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, TrendingUp, AlertTriangle, ArrowRight, Download } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface MovementRecommendation {
  productName: string;
  currentKievyan: number;
  currentSevan: number;
  totalQty: number;
  optimalKievyan: number;
  optimalSevan: number;
  moveToKievyan: number;
  moveToSevan: number;
  priority: 'High' | 'Medium' | 'Low';
  kievyanSales90d: number;
  sevanSales90d: number;
}

interface InventoryMovementData {
  recommendations: MovementRecommendation[];
  summary: {
    totalProducts: number;
    productsNeedingTransfer: number;
    totalUnitsToMove: number;
  };
}

export default function CompStyleInventoryMovement() {
  const [filterPriority, setFilterPriority] = useState<string>("all");

  const { data, isLoading } = useQuery<InventoryMovementData>({
    queryKey: ["/api/compstyle/inventory-movement"],
  });

  const filteredRecommendations = data?.recommendations.filter(rec => {
    if (filterPriority === "all") return true;
    return rec.priority === filterPriority;
  }) || [];

  const exportToCSV = () => {
    if (!data?.recommendations.length) return;

    const headers = [
      "Product Name",
      "Current Kievyan",
      "Current Sevan",
      "Total Qty",
      "Optimal Kievyan",
      "Optimal Sevan",
      "Move to Kievyan",
      "Move to Sevan",
      "Priority",
      "Kievyan Sales (90d)",
      "Sevan Sales (90d)"
    ];

    // Helper function to properly escape CSV fields
    const escapeCSVField = (field: any): string => {
      const str = String(field);
      // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      headers.map(escapeCSVField).join(","),
      ...filteredRecommendations.map(rec => [
        rec.productName,
        rec.currentKievyan,
        rec.currentSevan,
        rec.totalQty,
        rec.optimalKievyan,
        rec.optimalSevan,
        rec.moveToKievyan,
        rec.moveToSevan,
        rec.priority,
        rec.kievyanSales90d,
        rec.sevanSales90d
      ].map(escapeCSVField).join(","))
    ].join("\n");

    const blob = new Blob(['\ufeff' + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `inventory-movement-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="text-lg">Loading inventory movement data...</div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">📊 Inventory Movement</h1>
          <p className="text-slate-600">
            Optimized distribution recommendations between Kievyan 11 and Sevan 5 with priorities based on 90-day sales
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{data?.summary.totalProducts || 0}</div>
              <p className="text-xs text-slate-600">In inventory</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Need Transfer</CardTitle>
              <ArrowRight className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{data?.summary.productsNeedingTransfer || 0}</div>
              <p className="text-xs text-slate-600">Products requiring movement</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Units to Move</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{data?.summary.totalUnitsToMove || 0}</div>
              <p className="text-xs text-slate-600">Units for optimization</p>
            </CardContent>
          </Card>
        </div>

        {/* Transfer Recommendations */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Transfer Recommendations</CardTitle>
                <CardDescription>
                  Optimized stock distribution based on product rules and 90-day sales velocity
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="border rounded px-3 py-2 text-sm"
                >
                  <option value="all">All Priorities</option>
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
                <Button onClick={exportToCSV} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredRecommendations.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No transfer recommendations found
                </div>
              ) : (
                filteredRecommendations.map((rec, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${
                    rec.priority === 'High' ? 'bg-red-50 border-red-200' : 
                    rec.priority === 'Medium' ? 'bg-yellow-50 border-yellow-200' : 
                    'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{rec.productName}</div>
                        <div className="text-xs text-slate-600 mt-1">
                          Current: Kievyan {rec.currentKievyan} | Sevan {rec.currentSevan} (Total: {rec.totalQty})
                        </div>
                        <div className="text-xs text-slate-600">
                          Optimal: Kievyan {rec.optimalKievyan} | Sevan {rec.optimalSevan}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          90d Sales: Kievyan {rec.kievyanSales90d} | Sevan {rec.sevanSales90d}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        {rec.moveToKievyan > 0 && (
                          <div className="text-center">
                            <div className="text-xs text-slate-600 mb-1">Sevan → Kievyan</div>
                            <div className="text-lg font-bold text-blue-600">{rec.moveToKievyan}</div>
                            <div className="text-xs text-slate-500">units</div>
                          </div>
                        )}
                        {rec.moveToSevan > 0 && (
                          <div className="text-center">
                            <div className="text-xs text-slate-600 mb-1">Kievyan → Sevan</div>
                            <div className="text-lg font-bold text-green-600">{rec.moveToSevan}</div>
                            <div className="text-xs text-slate-500">units</div>
                          </div>
                        )}
                        <div className={`px-3 py-1 rounded text-xs font-medium ${
                          rec.priority === 'High' ? 'bg-red-100 text-red-800' : 
                          rec.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {rec.priority}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Optimization Logic Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Optimization Logic</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-slate-600 space-y-2">
              <p><strong>Distribution Rules:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>0% to Kievyan: Projector screens, screws, cabinets, furniture, patch panels, racktower cases, CS computers</li>
                <li>1 piece to Kievyan: Laptop bags, printers, projectors, laptops, monitors, tower cases, UPS</li>
                <li>10% to Kievyan: Shredders, coolers, brackets, speakers, accessories, batteries</li>
                <li>100% to Kievyan: LED computers</li>
                <li>20% to Kievyan: Default for all other products</li>
              </ul>
              <p className="mt-3"><strong>Priority Calculation (Based on 90-day Sales):</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>High Priority:</strong> Products with ≥10 units sold at destination location in last 90 days</li>
                <li><strong>Medium Priority:</strong> Products with 5-9 units sold at destination location in last 90 days</li>
                <li><strong>Low Priority:</strong> Products with &lt;5 units sold at destination location in last 90 days</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}