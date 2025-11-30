import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUp, CheckCircle, AlertCircle } from "lucide-react";
import { ChipInvoiceUpload } from "@/components/chip-invoice-upload";

export default function ChipInvoiceImport() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#2AA448] rounded-lg flex items-center justify-center">
              <FileUp className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">CHIP - Armenian Tax Invoice Import</h1>
          </div>
          <p className="text-slate-600">Import purchase and sales invoices from Armenian tax authority CSV files</p>
        </div>

        {/* Main Upload Section */}
        <div className="mb-6">
          <ChipInvoiceUpload />
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Supported Invoice Types
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 space-y-2">
              <p>✓ <strong>Purchase Invoices (Ստացված)</strong> - Received from suppliers</p>
              <p>✓ <strong>Sales Invoices (Դուրս գրված)</strong> - Issued to customers</p>
              <p>✓ UTF-8 Armenian text support</p>
              <p>✓ Automatic invoice deduplication by number</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                CSV Format Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 space-y-2">
              <p>• Row 1: Document type (ստացված or դուրս գրված)</p>
              <p>• Row 2-3: Header information</p>
              <p>• Row 4+: Invoice data rows</p>
              <p>• Minimum 35 columns for data parsing</p>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Features & Compliance</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">20% Armenian VAT</h4>
              <p className="text-slate-600">Automatic VAT calculation on all invoice line items</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Duplicate Prevention</h4>
              <p className="text-slate-600">Invoices are deduplicated by invoice number</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Multi-Currency Support</h4>
              <p className="text-slate-600">Track HS codes and product information</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
