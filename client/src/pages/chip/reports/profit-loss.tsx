import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

type ProfitLossData = {
  revenue: number;
  costOfGoods: number;
  grossProfit: number;
  expenses: { category: string; amount: number }[];
  totalExpenses: number;
  netIncome: number;
};

export default function ChipProfitLossReport() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date>(new Date());

  const { data: plData, isLoading } = useQuery<ProfitLossData>({
    queryKey: ["/api/chip/profit-loss", {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }],
  });

  const handleExport = () => {
    toast({
      title: "Coming Soon",
      description: "Export functionality will be implemented soon",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-5xl mx-auto">
          <Skeleton className="h-10 w-64 mb-8" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const revenue = plData?.revenue || 0;
  const costOfGoods = plData?.costOfGoods || 0;
  const grossProfit = plData?.grossProfit || 0;
  const expenses = plData?.expenses || [];
  const totalExpenses = plData?.totalExpenses || 0;
  const netIncome = plData?.netIncome || 0;

  const grossProfitMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const netProfitMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-[#2AA448]" />
                Profit & Loss Report
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Income statement for the selected period
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleExport}
              data-testid="button-export"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto p-6">
        {/* Date Range Selector */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Start Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      data-testid="button-start-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(startDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  End Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      data-testid="button-end-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(endDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => date && setEndDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* P&L Statement */}
        <Card>
          <CardHeader>
            <CardTitle>
              Statement for {format(startDate, "MMM d, yyyy")} - {format(endDate, "MMM d, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Revenue Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-slate-800 border-b pb-2">
                Revenue
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-600">Sales Revenue</span>
                  <span className="font-medium" data-testid="text-revenue">
                    {revenue.toLocaleString()} AMD
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-t font-bold">
                  <span>Total Revenue</span>
                  <span data-testid="text-total-revenue">{revenue.toLocaleString()} AMD</span>
                </div>
              </div>
            </div>

            {/* Cost of Goods Sold Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-slate-800 border-b pb-2">
                Cost of Goods Sold
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-600">Cost of Goods Sold</span>
                  <span className="font-medium" data-testid="text-cogs">
                    {costOfGoods.toLocaleString()} AMD
                  </span>
                </div>
              </div>
            </div>

            {/* Gross Profit */}
            <div className="mb-6 bg-green-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-bold text-green-800">Gross Profit</p>
                  <p className="text-sm text-green-600">
                    Margin: {grossProfitMargin.toFixed(1)}%
                  </p>
                </div>
                <p className="text-2xl font-bold text-green-800" data-testid="text-gross-profit">
                  {grossProfit.toLocaleString()} AMD
                </p>
              </div>
            </div>

            {/* Operating Expenses Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-slate-800 border-b pb-2">
                Operating Expenses
              </h3>
              <div className="space-y-2">
                {expenses.length > 0 ? (
                  expenses.map((expense) => (
                    <div 
                      key={expense.category} 
                      className="flex justify-between items-center py-2"
                      data-testid={`expense-category-${expense.category}`}
                    >
                      <span className="text-slate-600">{expense.category}</span>
                      <span className="font-medium">
                        {expense.amount.toLocaleString()} AMD
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 py-2">No expenses in this period</p>
                )}
                <div className="flex justify-between items-center py-2 border-t font-bold">
                  <span>Total Operating Expenses</span>
                  <span data-testid="text-total-expenses">
                    {totalExpenses.toLocaleString()} AMD
                  </span>
                </div>
              </div>
            </div>

            {/* Net Income */}
            <div className={`p-4 rounded-lg ${netIncome >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className={`text-xl font-bold ${netIncome >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                    Net Income
                  </p>
                  <p className={`text-sm ${netIncome >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    Net Margin: {netProfitMargin.toFixed(1)}%
                  </p>
                </div>
                <p 
                  className={`text-3xl font-bold ${netIncome >= 0 ? 'text-green-900' : 'text-red-900'}`}
                  data-testid="text-net-income"
                >
                  {netIncome >= 0 ? '+' : ''}{netIncome.toLocaleString()} AMD
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
