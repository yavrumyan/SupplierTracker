import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { CategoriesBrandsProvider } from "@/lib/categories-brands-context";
import { AuthProvider, useAuth } from "@/lib/auth-context";

import Home from "@/pages/home";
import SupplierDetail from "@/pages/supplier-detail";
import AddSupplier from "@/pages/add-supplier";
import AllSuppliers from "@/pages/all-suppliers";
import SearchPage from "@/pages/search";
import Settings from "@/pages/settings";
import ImportData from "@/pages/import";
import CompStyleDashboard from "@/pages/compstyle";
import CompStyleUpload from "@/pages/compstyle/upload";
import CompStyleDataOverview from "@/pages/compstyle/data-overview";
import ActualProductPricesPage from "@/pages/compstyle/actual-product-prices";
import CompStyleInventoryMovement from "@/pages/compstyle/inventory-movement";
import CompStyleSalesAnalysis from "@/pages/compstyle/sales-analysis";
import CompStyleProfitability from "@/pages/compstyle/profitability";
import CompStyleOrderRecommendations from "@/pages/compstyle/order-recommendations";
import CompStyleAnalyticsPhase1 from "@/pages/compstyle/analytics-phase1";
import CompStyleAnalyticsPhase2 from "@/pages/compstyle/analytics-phase2";
import CompStyleTransitTracking from "@/pages/compstyle/transit-tracking";
import ProductSearch from "@/pages/compstyle/product-search";
import ChipDashboard from "@/pages/chip/index";
import ChipInvoiceImport from "@/pages/chip/invoice";
import ChipExport from "@/pages/chip/export";
import ChipInvoicesList from "@/pages/chip/invoices";
import AIAgentPage from "@/pages/ai-agent";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";

function ProtectedApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-[#2AA448] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/search" component={SearchPage} />
        <Route path="/suppliers/:id" component={SupplierDetail} />
        <Route path="/suppliers" component={AllSuppliers} />
        <Route path="/add-supplier" component={AddSupplier} />
        <Route path="/import" component={ImportData} />
        <Route path="/compstyle" component={CompStyleDashboard} />
        <Route path="/compstyle/upload" component={CompStyleUpload} />
        <Route path="/compstyle/data-overview" component={CompStyleDataOverview} />
        <Route path="/compstyle/actual-product-prices" component={ActualProductPricesPage} />
        <Route path="/compstyle/analytics-phase1" component={CompStyleAnalyticsPhase1} />
        <Route path="/compstyle/analytics-phase2" component={CompStyleAnalyticsPhase2} />
        <Route path="/compstyle/inventory-movement" component={CompStyleInventoryMovement} />
        <Route path="/compstyle/transit-tracking" component={CompStyleTransitTracking} />
        <Route path="/compstyle/product-search" component={ProductSearch} />
        <Route path="/compstyle/sales-analysis" component={CompStyleSalesAnalysis} />
        <Route path="/compstyle/profitability" component={CompStyleProfitability} />
        <Route path="/compstyle/order-recommendations" component={CompStyleOrderRecommendations} />
        <Route path="/chip" component={ChipDashboard} />
        <Route path="/chip/invoice" component={ChipInvoiceImport} />
        <Route path="/chip/export" component={ChipExport} />
        <Route path="/chip/invoices" component={ChipInvoicesList} />
        <Route path="/ai-agent" component={AIAgentPage} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function Router() {
  const { user, loading } = useAuth();

  return (
    <Switch>
      <Route path="/login">
        {!loading && user ? <Redirect to="/" /> : <Login />}
      </Route>
      <Route>
        <ProtectedApp />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CategoriesBrandsProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </CategoriesBrandsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
