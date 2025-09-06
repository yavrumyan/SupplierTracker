import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Database, FileText, BarChart, CheckCircle, Package, ShoppingCart, Truck, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

// Data table component for displaying records
function DataTable({ title, description, data, isLoading, icon }: {
  title: string;
  description: string;
  data: any[] | undefined;
  isLoading: boolean;
  icon: React.ReactNode;
}) {
  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-4 bg-slate-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-slate-500 text-center py-4">
            {data === undefined ? "Click 'Refresh All Data' to load this table" : "No data available"}
          </div>
        </CardContent>
      </Card>
    );
  }

  const columns = Object.keys(data[0]).filter(key => key !== 'id');

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description} - {data.length} records shown</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-80 overflow-auto border rounded">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                {columns.map(col => (
                  <th key={col} className="p-2 text-left border-b font-medium">
                    {col.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  {columns.map(col => (
                    <td key={col} className="p-2 border-b">
                      {typeof row[col] === 'object' && row[col] instanceof Date 
                        ? row[col].toLocaleDateString()
                        : String(row[col] || '').substring(0, 50)
                      }
                      {String(row[col] || '').length > 50 && '...'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CompStyleDataOverview() {
  const queryClient = useQueryClient();
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tableData, setTableData] = useState<{
    totalStock?: any[];
    kievyanStock?: any[];
    sevanStock?: any[];
    transit?: any[];
    salesOrders?: any[];
    salesItems?: any[];
    purchaseOrders?: any[];
    purchaseItems?: any[];
    totalSales?: any[];
    totalProcurement?: any[];
  }>({});

  // Function to refresh all data manually using direct fetch
  const refreshAllData = async () => {
    setIsLoading(true);
    try {
      const endpoints = [
        { key: 'totalStock', url: '/api/compstyle/total-stock' },
        { key: 'kievyanStock', url: '/api/compstyle/kievyan-stock' },
        { key: 'sevanStock', url: '/api/compstyle/sevan-stock' },
        { key: 'transit', url: '/api/compstyle/transit' },
        { key: 'salesOrders', url: '/api/compstyle/sales-orders' },
        { key: 'salesItems', url: '/api/compstyle/sales-items' },
        { key: 'purchaseOrders', url: '/api/compstyle/purchase-orders' },
        { key: 'purchaseItems', url: '/api/compstyle/purchase-items' },
        { key: 'totalSales', url: '/api/compstyle/total-sales' },
        { key: 'totalProcurement', url: '/api/compstyle/total-procurement' },
      ];

      const results = await Promise.all(
        endpoints.map(async (endpoint) => {
          const response = await fetch(endpoint.url, { credentials: "include" });
          if (!response.ok) throw new Error(`Failed to fetch ${endpoint.key}`);
          const data = await response.json();
          return { key: endpoint.key, data };
        })
      );

      const newTableData: any = {};
      results.forEach(result => {
        newTableData[result.key] = result.data;
      });

      setTableData(newTableData);
      setDataLoaded(true);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
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
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Data Overview</h1>
              <p className="text-slate-600">
                Detailed view of all imported business data tables (complete data, scrollable)
              </p>
            </div>
            <Button
              onClick={refreshAllData}
              disabled={isLoading}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh All Data
            </Button>
          </div>
        </div>

        {/* 10 Data Table Sections */}
        <div className="space-y-6">
          <DataTable 
            title="Total Stock" 
            description="Complete inventory snapshot across all locations"
            data={tableData.totalStock}
            isLoading={isLoading}
            icon={<Database className="h-5 w-5 text-blue-600" />}
          />

          <DataTable 
            title="Kievyan Stock" 
            description="Stock data for Kievyan 11 retail location"
            data={tableData.kievyanStock}
            isLoading={isLoading}
            icon={<Package className="h-5 w-5 text-green-600" />}
          />

          <DataTable 
            title="Sevan Stock" 
            description="Stock data for Sevan 5 warehouse location"
            data={tableData.sevanStock}
            isLoading={isLoading}
            icon={<Package className="h-5 w-5 text-blue-600" />}
          />

          <DataTable 
            title="In Transit" 
            description="Products currently in transit between locations"
            data={tableData.transit}
            isLoading={isLoading}
            icon={<Truck className="h-5 w-5 text-orange-600" />}
          />

          <DataTable 
            title="Sales Orders" 
            description="Sales order headers with customer and date information"
            data={tableData.salesOrders}
            isLoading={isLoading}
            icon={<ShoppingCart className="h-5 w-5 text-emerald-600" />}
          />

          <DataTable 
            title="Sales Items" 
            description="Individual products sold with prices and quantities"
            data={tableData.salesItems}
            isLoading={isLoading}
            icon={<FileText className="h-5 w-5 text-emerald-500" />}
          />

          <DataTable 
            title="Purchase Orders" 
            description="Purchase order headers with supplier information"
            data={tableData.purchaseOrders}
            isLoading={isLoading}
            icon={<ShoppingCart className="h-5 w-5 text-purple-600" />}
          />

          <DataTable 
            title="Purchase Items" 
            description="Individual products purchased with costs and quantities"
            data={tableData.purchaseItems}
            isLoading={isLoading}
            icon={<FileText className="h-5 w-5 text-purple-500" />}
          />

          <DataTable 
            title="Total Sales Report" 
            description="Aggregated sales data by product and period"
            data={tableData.totalSales}
            isLoading={isLoading}
            icon={<BarChart className="h-5 w-5 text-teal-600" />}
          />

          <DataTable 
            title="Total Procurement Report" 
            description="Aggregated procurement data by product and supplier"
            data={tableData.totalProcurement}
            isLoading={isLoading}
            icon={<BarChart className="h-5 w-5 text-indigo-600" />}
          />
        </div>
      </div>
    </div>
  );
}