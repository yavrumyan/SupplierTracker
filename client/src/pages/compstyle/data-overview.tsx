import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Database, FileText, BarChart, CheckCircle, Package, ShoppingCart, Truck, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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

  // Create persistent queries with unique keys for data overview
  const totalStockQuery = useQuery<any[]>({ 
    queryKey: ['data-overview-cache', 'total-stock'], 
    queryFn: () => fetch('/api/compstyle/total-stock', { credentials: "include" }).then(res => res.json()),
    enabled: false,
    staleTime: Infinity, // Never automatically refetch
  });

  const kievyanStockQuery = useQuery<any[]>({ 
    queryKey: ['data-overview-cache', 'kievyan-stock'], 
    queryFn: () => fetch('/api/compstyle/kievyan-stock', { credentials: "include" }).then(res => res.json()),
    enabled: false,
    staleTime: Infinity,
  });

  const sevanStockQuery = useQuery<any[]>({ 
    queryKey: ['data-overview-cache', 'sevan-stock'], 
    queryFn: () => fetch('/api/compstyle/sevan-stock', { credentials: "include" }).then(res => res.json()),
    enabled: false,
    staleTime: Infinity,
  });

  const transitQuery = useQuery<any[]>({ 
    queryKey: ['data-overview-cache', 'transit'], 
    queryFn: () => fetch('/api/compstyle/transit', { credentials: "include" }).then(res => res.json()),
    enabled: false,
    staleTime: Infinity,
  });

  const salesOrdersQuery = useQuery<any[]>({ 
    queryKey: ['data-overview-cache', 'sales-orders'], 
    queryFn: () => fetch('/api/compstyle/sales-orders', { credentials: "include" }).then(res => res.json()),
    enabled: false,
    staleTime: Infinity,
  });

  const salesItemsQuery = useQuery<any[]>({ 
    queryKey: ['data-overview-cache', 'sales-items'], 
    queryFn: () => fetch('/api/compstyle/sales-items', { credentials: "include" }).then(res => res.json()),
    enabled: false,
    staleTime: Infinity,
  });

  const purchaseOrdersQuery = useQuery<any[]>({ 
    queryKey: ['data-overview-cache', 'purchase-orders'], 
    queryFn: () => fetch('/api/compstyle/purchase-orders', { credentials: "include" }).then(res => res.json()),
    enabled: false,
    staleTime: Infinity,
  });

  const purchaseItemsQuery = useQuery<any[]>({ 
    queryKey: ['data-overview-cache', 'purchase-items'], 
    queryFn: () => fetch('/api/compstyle/purchase-items', { credentials: "include" }).then(res => res.json()),
    enabled: false,
    staleTime: Infinity,
  });

  const totalSalesQuery = useQuery<any[]>({ 
    queryKey: ['data-overview-cache', 'total-sales'], 
    queryFn: () => fetch('/api/compstyle/total-sales', { credentials: "include" }).then(res => res.json()),
    enabled: false,
    staleTime: Infinity,
  });

  const totalProcurementQuery = useQuery<any[]>({ 
    queryKey: ['data-overview-cache', 'total-procurement'], 
    queryFn: () => fetch('/api/compstyle/total-procurement', { credentials: "include" }).then(res => res.json()),
    enabled: false,
    staleTime: Infinity,
  });

  // Check if any query is loading
  const isLoading = totalStockQuery.isFetching || kievyanStockQuery.isFetching || 
                   sevanStockQuery.isFetching || transitQuery.isFetching ||
                   salesOrdersQuery.isFetching || salesItemsQuery.isFetching ||
                   purchaseOrdersQuery.isFetching || purchaseItemsQuery.isFetching ||
                   totalSalesQuery.isFetching || totalProcurementQuery.isFetching;

  // Function to refresh all data manually
  const refreshAllData = () => {
    totalStockQuery.refetch();
    kievyanStockQuery.refetch();
    sevanStockQuery.refetch();
    transitQuery.refetch();
    salesOrdersQuery.refetch();
    salesItemsQuery.refetch();
    purchaseOrdersQuery.refetch();
    purchaseItemsQuery.refetch();
    totalSalesQuery.refetch();
    totalProcurementQuery.refetch();
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
            data={totalStockQuery.data}
            isLoading={totalStockQuery.isFetching}
            icon={<Database className="h-5 w-5 text-blue-600" />}
          />

          <DataTable 
            title="Kievyan Stock" 
            description="Stock data for Kievyan 11 retail location"
            data={kievyanStockQuery.data}
            isLoading={kievyanStockQuery.isFetching}
            icon={<Package className="h-5 w-5 text-green-600" />}
          />

          <DataTable 
            title="Sevan Stock" 
            description="Stock data for Sevan 5 warehouse location"
            data={sevanStockQuery.data}
            isLoading={sevanStockQuery.isFetching}
            icon={<Package className="h-5 w-5 text-blue-600" />}
          />

          <DataTable 
            title="In Transit" 
            description="Products currently in transit between locations"
            data={transitQuery.data}
            isLoading={transitQuery.isFetching}
            icon={<Truck className="h-5 w-5 text-orange-600" />}
          />

          <DataTable 
            title="Sales Orders" 
            description="Sales order headers with customer and date information"
            data={salesOrdersQuery.data}
            isLoading={salesOrdersQuery.isFetching}
            icon={<ShoppingCart className="h-5 w-5 text-emerald-600" />}
          />

          <DataTable 
            title="Sales Items" 
            description="Individual products sold with prices and quantities"
            data={salesItemsQuery.data}
            isLoading={salesItemsQuery.isFetching}
            icon={<FileText className="h-5 w-5 text-emerald-500" />}
          />

          <DataTable 
            title="Purchase Orders" 
            description="Purchase order headers with supplier information"
            data={purchaseOrdersQuery.data}
            isLoading={purchaseOrdersQuery.isFetching}
            icon={<ShoppingCart className="h-5 w-5 text-purple-600" />}
          />

          <DataTable 
            title="Purchase Items" 
            description="Individual products purchased with costs and quantities"
            data={purchaseItemsQuery.data}
            isLoading={purchaseItemsQuery.isFetching}
            icon={<FileText className="h-5 w-5 text-purple-500" />}
          />

          <DataTable 
            title="Total Sales Report" 
            description="Aggregated sales data by product and period"
            data={totalSalesQuery.data}
            isLoading={totalSalesQuery.isFetching}
            icon={<BarChart className="h-5 w-5 text-teal-600" />}
          />

          <DataTable 
            title="Total Procurement Report" 
            description="Aggregated procurement data by product and supplier"
            data={totalProcurementQuery.data}
            isLoading={totalProcurementQuery.isFetching}
            icon={<BarChart className="h-5 w-5 text-indigo-600" />}
          />
        </div>
      </div>
    </div>
  );
}