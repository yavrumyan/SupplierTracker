import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, ArrowLeft, Package, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

const DATE_LABELS: Record<string, string> = {
  today: "Today",
  "3days": "Last 3 Days",
  "1week": "Last 1 Week",
  "2weeks": "Last 2 Weeks",
  "1month": "Last 1 Month",
};

function buildSearchParams(supplier: string, source: string, dateAdded: string, limit: string) {
  const params = new URLSearchParams();
  if (supplier) params.set("supplier", supplier);
  if (source) params.set("source", source);
  if (dateAdded) params.set("dateAdded", dateAdded);
  params.set("limit", limit);
  params.set("page", "1");
  return params.toString();
}

function toCSV(rows: any[]): string {
  const headers = [
    "Supplier", "Source", "Brand", "Category", "Model",
    "Product Name", "Price", "Currency", "Stock", "MOQ",
    "Warranty", "Notes", "Date Added"
  ];
  const escape = (val: any) => {
    if (val == null) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const lines = [
    headers.join(","),
    ...rows.map(r => [
      escape(r.supplier),
      escape(r.sourceType === "price_list" ? "Price List" : r.sourceType === "offer" ? "Offer" : r.sourceType),
      escape(r.brand),
      escape(r.category),
      escape(r.model),
      escape(r.productName),
      escape(r.price),
      escape(r.currency),
      escape(r.stock),
      escape(r.moq),
      escape(r.warranty),
      escape(r.notes),
      escape(r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-GB") : ""),
    ].join(","))
  ];
  return lines.join("\n");
}

function downloadCSV(content: string, filename: string) {
  const bom = "\uFEFF";
  const blob = new Blob([bom + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ChipExport() {
  const { toast } = useToast();
  const [supplier, setSupplier] = useState("");
  const [source, setSource] = useState("");
  const [dateAdded, setDateAdded] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const { data: suppliers = [] } = useQuery({
    queryKey: ["/api/suppliers"],
    queryFn: async () => {
      const res = await fetch("/api/suppliers");
      if (!res.ok) throw new Error("Failed to fetch suppliers");
      return res.json();
    },
  });

  const countParams = buildSearchParams(supplier, source, dateAdded, "1");
  const { data: countData, isLoading: isCountLoading } = useQuery({
    queryKey: ["/api/search", "count", supplier, source, dateAdded],
    queryFn: async () => {
      const res = await fetch(`/api/search?${countParams}`);
      if (!res.ok) throw new Error("Failed to fetch count");
      return res.json();
    },
    staleTime: 1000 * 30,
  });

  const totalCount = countData?.totalCount ?? null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportParams = buildSearchParams(supplier, source, dateAdded, "0");
      const res = await fetch(`/api/search?${exportParams}`);
      if (!res.ok) throw new Error("Failed to fetch export data");
      const data = await res.json();
      const rows = data.results || [];
      if (rows.length === 0) {
        toast({ title: "No products found", description: "Adjust your filters and try again.", variant: "destructive" });
        return;
      }
      const csv = toCSV(rows);
      const today = new Date().toISOString().slice(0, 10);
      downloadCSV(csv, `b2b-export_${today}.csv`);
      toast({ title: "Export successful", description: `${rows.length} products exported.` });
    } catch (err) {
      toast({ title: "Export failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/chip">
            <Button variant="ghost" size="sm" className="mb-4 gap-2 text-slate-600 hover:text-slate-900">
              <ArrowLeft className="w-4 h-4" />
              Back to CHIP
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#2AA448] rounded-lg flex items-center justify-center">
              <Download className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Export for B2B Portal</h1>
          </div>
          <p className="text-slate-600">Build a custom product export from your price database</p>
        </div>

        {/* Filters */}
        <Card className="mb-5">
          <CardHeader>
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Supplier */}
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-1 block">Supplier</Label>
              <Select value={supplier || "all"} onValueChange={(v) => setSupplier(v === "all" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Suppliers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suppliers</SelectItem>
                  {[...suppliers]
                    .sort((a: any, b: any) => a.name.localeCompare(b.name))
                    .map((s: any) => (
                      <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Source */}
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-1 block">Source</Label>
              <Select value={source || "all"} onValueChange={(v) => setSource(v === "all" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="price_list">Price List</SelectItem>
                  <SelectItem value="offer">Offer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Added */}
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-1 block">Date Added</Label>
              <Select value={dateAdded || "all"} onValueChange={(v) => setDateAdded(v === "all" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="3days">Last 3 Days</SelectItem>
                  <SelectItem value="1week">Last 1 Week</SelectItem>
                  <SelectItem value="2weeks">Last 2 Weeks</SelectItem>
                  <SelectItem value="1month">Last 1 Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Count & Export */}
        <Card>
          <CardContent className="p-6">
            {/* Matching count */}
            <div className="flex items-center gap-3 mb-5 p-4 bg-slate-50 rounded-lg">
              <Package className="w-5 h-5 text-slate-400 shrink-0" />
              <div>
                <p className="text-sm text-slate-500">Matching products</p>
                {isCountLoading ? (
                  <p className="text-lg font-semibold text-slate-400">Loading...</p>
                ) : totalCount !== null ? (
                  <p className="text-lg font-semibold text-slate-900">{totalCount.toLocaleString()} products</p>
                ) : (
                  <p className="text-lg font-semibold text-slate-400">—</p>
                )}
              </div>
            </div>

            {/* Active filter summary */}
            {(supplier || source || dateAdded) && (
              <div className="text-xs text-slate-500 mb-4 space-y-1">
                {supplier && <p>• Supplier: <span className="font-medium text-slate-700">{supplier}</span></p>}
                {source && <p>• Source: <span className="font-medium text-slate-700">{source === "price_list" ? "Price List" : "Offer"}</span></p>}
                {dateAdded && <p>• Date Added: <span className="font-medium text-slate-700">{DATE_LABELS[dateAdded]}</span></p>}
              </div>
            )}

            {/* Export button */}
            <Button
              onClick={handleExport}
              disabled={isExporting || totalCount === 0}
              className="w-full bg-[#2AA448] hover:bg-[#228a3a] text-white gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export CSV
                </>
              )}
            </Button>
            <p className="text-xs text-slate-400 mt-2 text-center">
              CSV includes: Supplier, Source, Brand, Category, Model, Product Name, Price, Currency, Stock, MOQ, Warranty, Notes, Date Added
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
