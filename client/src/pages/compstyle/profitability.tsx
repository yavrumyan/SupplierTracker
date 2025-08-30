import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, DollarSign, TrendingUp, BarChart3, PieChart } from "lucide-react";
import { Link } from "wouter";

export default function CompStyleProfitability() {
  // Mock data for demonstration
  const profitabilityData = [
    {
      category: "Graphics Cards",
      revenue: "$67,890",
      cost: "$48,750",
      profit: "$19,140",
      margin: "28.2%",
      trend: "up"
    },
    {
      category: "Processors",
      revenue: "$45,230",
      cost: "$31,660",
      profit: "$13,570",
      margin: "30.0%",
      trend: "up"
    },
    {
      category: "Memory & Storage",
      revenue: "$38,900",
      cost: "$29,180",
      profit: "$9,720",
      margin: "25.0%",
      trend: "down"
    },
    {
      category: "Motherboards",
      revenue: "$23,400",
      cost: "$17,550",
      profit: "$5,850",
      margin: "25.0%",
      trend: "up"
    }
  ];

  const marginAnalysis = [
    {
      range: "30%+ margin",
      products: 23,
      value: "$34,560",
      percentage: "18.5%"
    },
    {
      range: "20-30% margin",
      products: 67,
      value: "$89,340",
      percentage: "47.9%"
    },
    {
      range: "10-20% margin",
      products: 45,
      value: "$52,180",
      percentage: "28.0%"
    },
    {
      range: "Below 10%",
      products: 12,
      value: "$10,340",
      percentage: "5.6%"
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Profitability Reports</h1>
          <p className="text-slate-600">
            Analyze margins, ROI, and financial performance across product categories
          </p>
        </div>

        {/* Overall Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">$48,280</div>
              <p className="text-xs text-slate-600">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Margin</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">27.8%</div>
              <p className="text-xs text-slate-600">Across all products</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ROI</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">38.5%</div>
              <p className="text-xs text-slate-600">Return on investment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Margin Items</CardTitle>
              <PieChart className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">23</div>
              <p className="text-xs text-slate-600">30%+ margin</p>
            </CardContent>
          </Card>
        </div>

        {/* Category Profitability */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Category Profitability Analysis</CardTitle>
            <CardDescription>
              Profit performance by product category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profitabilityData.map((category, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      {category.category}
                      {category.trend === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-6 text-center">
                    <div>
                      <div className="font-bold">{category.revenue}</div>
                      <div className="text-xs text-slate-600">Revenue</div>
                    </div>
                    <div>
                      <div className="font-bold text-red-600">{category.cost}</div>
                      <div className="text-xs text-slate-600">Cost</div>
                    </div>
                    <div>
                      <div className="font-bold text-green-600">{category.profit}</div>
                      <div className="text-xs text-slate-600">Profit</div>
                    </div>
                    <div>
                      <div className="font-bold text-blue-600">{category.margin}</div>
                      <div className="text-xs text-slate-600">Margin</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Margin Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Profit Margin Distribution</CardTitle>
            <CardDescription>
              Product distribution by profit margin ranges
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {marginAnalysis.map((range, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{range.range}</div>
                    <div className="text-sm text-slate-600">{range.percentage} of portfolio</div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="font-bold">{range.products}</div>
                      <div className="text-xs text-slate-600">Products</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">{range.value}</div>
                      <div className="text-xs text-slate-600">Value</div>
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