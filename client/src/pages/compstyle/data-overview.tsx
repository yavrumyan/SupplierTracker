import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Database, FileText, BarChart, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

export default function CompStyleDataOverview() {
  const { data: overview, isLoading } = useQuery({
    queryKey: ['/api/compstyle/data-overview'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded mb-4 w-64"></div>
            <div className="h-4 bg-slate-200 rounded mb-8 w-96"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-slate-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            Real-time status and summary of uploaded CompStyle data files
          </p>
        </div>

        {/* Real Data Files Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {overview?.files?.map((file, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {file.type.includes('Inventory') && <Database className="h-4 w-4 text-blue-600" />}
                    {file.type.includes('Order') && <BarChart className="h-4 w-4 text-green-600" />}
                    {file.type.includes('Line Items') && <FileText className="h-4 w-4 text-purple-600" />}
                    {file.type.includes('Analytics') && <Database className="h-4 w-4 text-orange-600" />}
                    {file.type.includes('Transit') && <FileText className="h-4 w-4 text-red-600" />}
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {file.status}
                    </span>
                  </div>
                </div>
                <h3 className="font-semibold text-sm mb-1">{file.name}</h3>
                <p className="text-xs text-slate-600 mb-2">{file.type}</p>
                <div className="text-lg font-bold text-slate-900">{file.records.toLocaleString()}</div>
                <div className="text-xs text-slate-500">records</div>
              </CardContent>
            </Card>
          ))}
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

        {/* Real Data Summary */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Data Summary</CardTitle>
            <CardDescription>
              Real-time statistics from uploaded business data
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
                <div className="text-2xl font-bold text-green-600">{overview?.totals?.totalFiles || 0}</div>
                <div className="text-sm text-slate-600">Data Sources</div>
                <div className="text-xs text-slate-500">Files processed</div>
              </div>
              <div className="text-center p-4">
                <div className="text-2xl font-bold text-purple-600">{overview?.totals?.totalRecords?.toLocaleString() || '0'}</div>
                <div className="text-sm text-slate-600">Total Records</div>
                <div className="text-xs text-slate-500">Data points analyzed</div>
              </div>
              <div className="text-center p-4">
                <div className="text-2xl font-bold text-orange-600">Live</div>
                <div className="text-sm text-slate-600">Status</div>
                <div className="text-xs text-slate-500">
                  {overview?.totals?.lastUpdated 
                    ? new Date(overview.totals.lastUpdated).toLocaleTimeString()
                    : 'Processing...'
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}