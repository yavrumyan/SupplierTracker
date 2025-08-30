import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Database, FileText, BarChart } from "lucide-react";
import { Link } from "wouter";

export default function CompStyleDataOverview() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/compstyle">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to CompStyle
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Data Overview</h1>
          <p className="text-slate-600">
            View status and summary of uploaded CompStyle data files
          </p>
        </div>

        {/* Data Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Core Data Files */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                Core Inventory Data
              </CardTitle>
              <CardDescription>Current snapshot files</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Stock</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Ready</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Kievyan Stock</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Ready</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Sevan Stock</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Ready</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">In Transit</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Ready</span>
              </div>
            </CardContent>
          </Card>

          {/* Sales Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5 text-green-600" />
                Sales Data
              </CardTitle>
              <CardDescription>Period-based sales files</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Sevan Sales</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Ready</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Kievyan Sales</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Ready</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Sales</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Ready</span>
              </div>
            </CardContent>
          </Card>

          {/* Purchase Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Purchase Data
              </CardTitle>
              <CardDescription>Period-based purchase files</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Sevan Purchases</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Ready</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Kievyan Purchases</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Ready</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Procurement</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Ready</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inventory Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Analysis</CardTitle>
              <CardDescription>
                Analyze stock levels, movement patterns, and optimization opportunities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/compstyle/inventory-movement">
                <Button className="w-full" variant="outline">
                  Inventory Movement Analysis
                </Button>
              </Link>
              <div className="text-sm text-slate-600">
                • Stock level optimization
                • Location transfer recommendations
                • Dead stock identification
              </div>
            </CardContent>
          </Card>

          {/* Sales & Profitability */}
          <Card>
            <CardHeader>
              <CardTitle>Sales & Profitability</CardTitle>
              <CardDescription>
                Analyze sales performance, profits, and order patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/compstyle/sales-analysis">
                <Button className="w-full" variant="outline">
                  Sales Performance
                </Button>
              </Link>
              <div className="text-sm text-slate-600">
                • Product performance tracking
                • Location-based sales analysis
                • Profit margin optimization
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Summary */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Data Summary</CardTitle>
            <CardDescription>
              Current data status for business intelligence analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4">
                <div className="text-2xl font-bold text-blue-600">2</div>
                <div className="text-sm text-slate-600">Locations</div>
                <div className="text-xs text-slate-500">Kievyan & Sevan</div>
              </div>
              <div className="text-center p-4">
                <div className="text-2xl font-bold text-green-600">10</div>
                <div className="text-sm text-slate-600">Data Sources</div>
                <div className="text-xs text-slate-500">Excel files processed</div>
              </div>
              <div className="text-center p-4">
                <div className="text-2xl font-bold text-purple-600">4</div>
                <div className="text-sm text-slate-600">Analysis Tools</div>
                <div className="text-xs text-slate-500">BI features available</div>
              </div>
              <div className="text-center p-4">
                <div className="text-2xl font-bold text-orange-600">Real-time</div>
                <div className="text-sm text-slate-600">Updates</div>
                <div className="text-xs text-slate-500">Live data processing</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}