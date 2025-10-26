import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { CategoriesBrandsProvider } from "@/lib/categories-brands-context";
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
import NotFound from "@/pages/not-found";
import { lazy } from "react";

function Router() {
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
        <Route path="/compstyle/analytics-phase1" component={lazy(() => import("@/pages/compstyle/analytics-phase1"))} />
        <Route path="/compstyle/analytics-phase2" component={lazy(() => import("@/pages/compstyle/analytics-phase2"))} />
        <Route path="/compstyle/inventory-movement" component={CompStyleInventoryMovement} />
        <Route path="/compstyle/sales-analysis" component={CompStyleSalesAnalysis} />
        <Route path="/compstyle/profitability" component={CompStyleProfitability} />
        <Route path="/compstyle/order-recommendations" component={CompStyleOrderRecommendations} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CategoriesBrandsProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </CategoriesBrandsProvider>
    </QueryClientProvider>
  );
}

export default App;