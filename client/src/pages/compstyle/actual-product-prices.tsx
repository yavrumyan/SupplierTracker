import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import ActualProductPrices from "@/components/actual-product-prices";

export default function ActualProductPricesPage() {
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Actual Product Prices</h1>
          <p className="text-slate-600">
            Comprehensive product catalog with aggregated pricing data and supplier management
          </p>
        </div>

        {/* Product Prices Component */}
        <ActualProductPrices />
      </div>
    </div>
  );
}