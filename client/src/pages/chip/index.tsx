import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  DollarSign, 
  FileText,
  Calendar,
  BarChart3
} from "lucide-react";
import { Link } from "wouter";
import { ChipInvoiceUpload } from "@/components/chip-invoice-upload";

interface DashboardStats {
  productsCount: number;
  lowStockCount: number;
  totalInventoryValue: string;
  customersCount: number;
  suppliersCount: number;
  pendingPurchases: number;
  pendingPayments: number;
  thisMonthRevenue: string;
  thisMonthProfit: string;
  thisMonthExpenses: string;
  outstandingInvoices: string;
  cashOnHand: string;
}

export default function ChipDashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/chip/dashboard-stats"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const metrics = [
    {
      title: "Total Products",
      value: stats?.productsCount || 0,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      link: "/chip/products"
    },
    {
      title: "Low Stock Items",
      value: stats?.lowStockCount || 0,
      icon: TrendingUp,
      color: "text-red-600",
      bgColor: "bg-red-50",
      link: "/chip/products"
    },
    {
      title: "Inventory Value",
      value: `${stats?.totalInventoryValue || '0'} AMD`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
      link: "/chip/products"
    },
    {
      title: "Total Customers",
      value: stats?.customersCount || 0,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      link: "/chip/customers"
    },
    {
      title: "Total Suppliers",
      value: stats?.suppliersCount || 0,
      icon: ShoppingCart,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      link: "/chip/suppliers"
    },
    {
      title: "This Month Revenue",
      value: `${stats?.thisMonthRevenue || '0'} AMD`,
      icon: BarChart3,
      color: "text-[#2AA448]",
      bgColor: "bg-green-50",
      link: "/chip/sales"
    },
    {
      title: "This Month Profit",
      value: `${stats?.thisMonthProfit || '0'} AMD`,
      icon: TrendingUp,
      color: "text-[#2AA448]",
      bgColor: "bg-green-50",
      link: "/chip/reports/profit-loss"
    },
    {
      title: "Outstanding Invoices",
      value: `${stats?.outstandingInvoices || '0'} AMD`,
      icon: FileText,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      link: "/chip/invoices"
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-800">CHIP Dashboard</h1>
              <p className="text-sm text-slate-600 mt-1">Small Business ERP System</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" data-testid="button-export-data">
                <FileText className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Link href="/chip/products">
                <Button className="bg-[#2AA448] hover:bg-[#239639]" size="sm" data-testid="button-add-product">
                  <Package className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Link key={metric.title} href={metric.link}>
                <Card 
                  className="hover:shadow-md transition-shadow cursor-pointer" 
                  data-testid={`card-${metric.title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium uppercase text-slate-500 tracking-wide mb-2">
                          {metric.title}
                        </p>
                        <p className="text-2xl font-bold text-slate-900">
                          {metric.value}
                        </p>
                      </div>
                      <div className={`${metric.bgColor} ${metric.color} p-3 rounded-lg`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-4 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5 text-[#2AA448]" />
                  Inventory
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/chip/stock">
                  <Button variant="outline" className="w-full justify-start" data-testid="link-stock">
                    <Package className="h-4 w-4 mr-2" />
                    Stock
                  </Button>
                </Link>
                <Link href="/chip/purchases">
                  <Button variant="outline" className="w-full justify-start" data-testid="link-purchases">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Purchase Orders
                  </Button>
                </Link>
                <Link href="/chip/sales">
                  <Button variant="outline" className="w-full justify-start" data-testid="link-sales">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Sales Orders
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <ChipInvoiceUpload />
          </div>

          <div>
            <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-[#2AA448]" />
                Contacts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/chip/customers">
                <Button variant="outline" className="w-full justify-start" data-testid="link-customers">
                  <Users className="h-4 w-4 mr-2" />
                  Customers
                </Button>
              </Link>
              <Link href="/chip/suppliers">
                <Button variant="outline" className="w-full justify-start" data-testid="link-suppliers">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Suppliers
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#2AA448]" />
                Finance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/chip/invoices">
                <Button variant="outline" className="w-full justify-start" data-testid="link-invoices">
                  <FileText className="h-4 w-4 mr-2" />
                  Invoices
                </Button>
              </Link>
              <Link href="/chip/expenses">
                <Button variant="outline" className="w-full justify-start" data-testid="link-expenses">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Expenses
                </Button>
              </Link>
              <Link href="/chip/reports/profit-loss">
                <Button variant="outline" className="w-full justify-start" data-testid="link-reports">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Reports
                </Button>
              </Link>
            </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
