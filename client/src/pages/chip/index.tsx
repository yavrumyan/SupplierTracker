import { Card, CardContent } from "@/components/ui/card";
import { FileUp, Download, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function ChipHub() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="w-14 h-14 bg-[#2AA448] rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">CHIP</h1>
          <p className="text-slate-500 text-base">Choose a section to get started</p>
        </div>

        {/* Section Cards */}
        <div className="grid gap-5">
          <Link href="/chip/invoice">
            <Card className="cursor-pointer border-2 border-transparent hover:border-[#2AA448] hover:shadow-md transition-all group">
              <CardContent className="p-6 flex items-center gap-5">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-[#2AA448] transition-colors">
                  <FileUp className="w-6 h-6 text-[#2AA448] group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-slate-900 mb-1">Invoice Import</h2>
                  <p className="text-sm text-slate-500">Import purchase and sales invoices from Armenian tax authority CSV files</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#2AA448] transition-colors shrink-0" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/chip/export">
            <Card className="cursor-pointer border-2 border-transparent hover:border-[#2AA448] hover:shadow-md transition-all group">
              <CardContent className="p-6 flex items-center gap-5">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-[#2AA448] transition-colors">
                  <Download className="w-6 h-6 text-[#2AA448] group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-slate-900 mb-1">Export for B2B Portal</h2>
                  <p className="text-sm text-slate-500">Export filtered product lists from your price database as a CSV file for the B2B portal</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#2AA448] transition-colors shrink-0" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
