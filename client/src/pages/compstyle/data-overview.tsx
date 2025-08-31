import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Database, FileText, BarChart, CheckCircle, Package, ShoppingCart, Truck } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

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
          <div className="text-slate-500 text-center py-4">No data available</div>
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
  // Fetch data for all 10 tables
  const totalStockQuery = useQuery({ queryKey: ['/api/compstyle/total-stock'] });
  const locationStockQuery = useQuery({ queryKey: ['/api/compstyle/location-stock'] });
  const transitQuery = useQuery({ queryKey: ['/api/compstyle/transit'] });
  const salesOrdersQuery = useQuery({ queryKey: ['/api/compstyle/sales-orders'] });
  const salesItemsQuery = useQuery({ queryKey: ['/api/compstyle/sales-items'] });
  const purchaseOrdersQuery = useQuery({ queryKey: ['/api/compstyle/purchase-orders'] });
  const purchaseItemsQuery = useQuery({ queryKey: ['/api/compstyle/purchase-items'] });
  const totalSalesQuery = useQuery({ queryKey: ['/api/compstyle/total-sales'] });
  const totalProcurementQuery = useQuery({ queryKey: ['/api/compstyle/total-procurement'] });

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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Data Overview</h1>
          <p className="text-slate-600">
            Detailed view of all imported business data tables (20 rows each, scrollable)
          </p>
        </div>

        {/* 10 Data Table Sections */}
        <div className="space-y-6">
          <DataTable 
            title="Total Stock" 
            description="Complete inventory snapshot across all locations"
            data={totalStockQuery.data}
            isLoading={totalStockQuery.isLoading}
            icon={<Database className="h-5 w-5 text-blue-600" />}
          />

          <DataTable 
            title="Location Stock" 
            description="Stock data by specific locations (Kievyan and Sevan)"
            data={locationStockQuery.data}
            isLoading={locationStockQuery.isLoading}
            icon={<Package className="h-5 w-5 text-green-600" />}
          />

          <DataTable 
            title="In Transit" 
            description="Products currently in transit between locations"
            data={transitQuery.data}
            isLoading={transitQuery.isLoading}
            icon={<Truck className="h-5 w-5 text-orange-600" />}
          />

          <DataTable 
            title="Sales Orders" 
            description="Sales order headers with customer and date information"
            data={salesOrdersQuery.data}
            isLoading={salesOrdersQuery.isLoading}
            icon={<ShoppingCart className="h-5 w-5 text-emerald-600" />}
          />

          <DataTable 
            title="Sales Items" 
            description="Individual products sold with prices and quantities"
            data={salesItemsQuery.data}
            isLoading={salesItemsQuery.isLoading}
            icon={<FileText className="h-5 w-5 text-emerald-500" />}
          />

          <DataTable 
            title="Purchase Orders" 
            description="Purchase order headers with supplier information"
            data={purchaseOrdersQuery.data}
            isLoading={purchaseOrdersQuery.isLoading}
            icon={<ShoppingCart className="h-5 w-5 text-purple-600" />}
          />

          <DataTable 
            title="Purchase Items" 
            description="Individual products purchased with costs and quantities"
            data={purchaseItemsQuery.data}
            isLoading={purchaseItemsQuery.isLoading}
            icon={<FileText className="h-5 w-5 text-purple-500" />}
          />

          <DataTable 
            title="Total Sales Report" 
            description="Aggregated sales data by product and period"
            data={totalSalesQuery.data}
            isLoading={totalSalesQuery.isLoading}
            icon={<BarChart className="h-5 w-5 text-teal-600" />}
          />

          <DataTable 
            title="Total Procurement Report" 
            description="Aggregated procurement data by product and supplier"
            data={totalProcurementQuery.data}
            isLoading={totalProcurementQuery.isLoading}
            icon={<BarChart className="h-5 w-5 text-indigo-600" />}
          />
        </div>
      </div>
    </div>
  );
}