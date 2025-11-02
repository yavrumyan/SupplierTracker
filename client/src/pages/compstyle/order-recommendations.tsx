import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, ShoppingCart, AlertTriangle, TrendingUp, DollarSign } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

type SalesPeriod = '30d' | '60d' | '90d' | '120d' | '150d' | '180d';
type TransitTime = '2w' | '3w' | '4w' | '5w' | '6w' | '8w' | '12w';

const transitMultipliers: Record<TransitTime, number> = {
  '2w': 0.5,
  '3w': 0.75,
  '4w': 1,
  '5w': 1.25,
  '6w': 1.5,
  '8w': 2,
  '12w': 3
};

const transitLabels: Record<TransitTime, string> = {
  '2w': '2 weeks',
  '3w': '3 weeks',
  '4w': '4 weeks',
  '5w': '5 weeks',
  '6w': '6 weeks',
  '8w': '8 weeks',
  '12w': '12 weeks'
};

export default function CompStyleOrderRecommendations() {
  const [salesPeriod, setSalesPeriod] = useState<SalesPeriod>('30d');
  const [transitTime, setTransitTime] = useState<TransitTime>('4w');

  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ['/api/compstyle/analytics/order-recommendations'],
    refetchOnWindowFocus: false,
  });

  // Calculate dynamic Order Qty based on selected filters
  const getOrderQty = (item: any) => {
    const salesKey = `sold${salesPeriod.replace('d', 'D')}` as keyof typeof item;
    const soldQty = item[salesKey] || 0;
    const multiplier = transitMultipliers[transitTime];
    const baseOrderQty = soldQty - item.stock - item.transit;
    return Math.max(0, Math.ceil(baseOrderQty * multiplier));
  };

  const enrichedRecommendations = recommendations.map((item: any) => ({
    ...item,
    calculatedOrderQty: getOrderQty(item)
  }));

  const criticalReorders = enrichedRecommendations.filter((item: any) => item.priority === 'critical');
  const highReorders = enrichedRecommendations.filter((item: any) => item.priority === 'high');
  const urgentReorders = [...criticalReorders, ...highReorders];

  const totalRecommendedValue = enrichedRecommendations.reduce((sum: number, item: any) => 
    sum + (item.calculatedOrderQty * item.currentCost), 0
  );

  const totalExpectedProfit = enrichedRecommendations.reduce((sum: number, item: any) => 
    sum + (item.calculatedOrderQty * item.currentCost * (item.profitMargin / 100)), 0
  );

  const avgROI = totalRecommendedValue > 0 ? (totalExpectedProfit / totalRecommendedValue) * 100 : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">Loading recommendations...</div>
        </div>
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
              <div className="text-2xl font-bold text-blue-600">
                {enrichedRecommendations.filter((r: any) => r.calculatedOrderQty > 0).length}
              </div>
              <p className="text-xs text-slate-600">Recommended items</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Urgent Reorders</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {urgentReorders.filter((r: any) => r.calculatedOrderQty > 0).length}
              </div>
              <p className="text-xs text-slate-600">Critical & High priority</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Est. Order Value</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${totalRecommendedValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-slate-600">Total investment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expected ROI</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {avgROI.toFixed(1)}%
              </div>
              <p className="text-xs text-slate-600">Based on margins</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8 bg-white shadow-sm">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-lg">Order Parameters</CardTitle>
            <CardDescription>
              Adjust sales period and transit time to customize order quantities
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 block">Sales Period</label>
                <Select value={salesPeriod} onValueChange={(value) => setSalesPeriod(value as SalesPeriod)}>
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Select sales period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30d">Sold (30d)</SelectItem>
                    <SelectItem value="60d">Sold (60d)</SelectItem>
                    <SelectItem value="90d">Sold (90d)</SelectItem>
                    <SelectItem value="120d">Sold (120d)</SelectItem>
                    <SelectItem value="150d">Sold (150d)</SelectItem>
                    <SelectItem value="180d">Sold (180d)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  Historical sales period to base calculations on
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 block">Transit Time</label>
                <Select value={transitTime} onValueChange={(value) => setTransitTime(value as TransitTime)}>
                  <SelectTrigger className="w-full bg-white">
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
                <p className="text-xs text-slate-500">
                  Expected delivery time multiplier for order quantity
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Current Settings:</strong> Using <span className="font-semibold">{salesPeriod}</span> sales data with <span className="font-semibold">{transitLabels[transitTime]}</span> transit time (multiplier: {transitMultipliers[transitTime]}×)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* All Recommendations Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Order Recommendations</CardTitle>
            <CardDescription>
              Complete list sorted by priority score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="text-center">Transit</TableHead>
                  <TableHead className="text-center">Sold ({salesPeriod})</TableHead>
                  <TableHead className="text-center">Order Qty</TableHead>
                  <TableHead className="text-center">Last Supplier</TableHead>
                  <TableHead className="text-center">Last Price</TableHead>
                  <TableHead className="text-center">Expected Profit</TableHead>
                  <TableHead className="text-center">Margin %</TableHead>
                  <TableHead className="text-center">Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrichedRecommendations.map((item: any, index: number) => {
                  const salesKey = `sold${salesPeriod.replace('d', 'D')}` as keyof typeof item;
                  const soldQty = item[salesKey] || 0;
                  
                  return (
                    <TableRow key={index} className={
                      item.priority === 'critical' ? 'bg-red-50' :
                      item.priority === 'high' ? 'bg-orange-50' :
                      item.priority === 'medium' ? 'bg-yellow-50' : ''
                    }>
                      <TableCell className="font-medium max-w-xs">
                        <div className="truncate">{item.productName}</div>
                      </TableCell>
                      <TableCell className="text-center">{item.stock}</TableCell>
                      <TableCell className="text-center">{item.transit}</TableCell>
                      <TableCell className="text-center font-medium">{soldQty}</TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold ${item.calculatedOrderQty > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                          {item.calculatedOrderQty}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-sm">{item.lastSupplier}</TableCell>
                      <TableCell className="text-center">${item.lastPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-center text-green-600 font-medium">
                        ${(item.calculatedOrderQty * item.currentCost * (item.profitMargin / 100)).toFixed(0)}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        <span className={
                          item.profitMargin >= 30 ? 'text-green-600' :
                          item.profitMargin >= 15 ? 'text-orange-600' :
                          'text-red-600'
                        }>
                          {item.profitMargin.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          item.priority === 'critical' ? 'bg-red-100 text-red-800' :
                          item.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {item.priority}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}