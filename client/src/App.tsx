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
import CompStyleAnalyticsPhase2 from "@/pages/compstyle/analytics-phase2";
import CompStyleTransitTracking from "@/pages/compstyle/transit-tracking";
import ProductSearch from "@/pages/compstyle/product-search";
import ChipDashboard from "@/pages/chip/index";
import ChipProducts from "@/pages/chip/products";
import ChipProductForm from "@/pages/chip/product-form";
import ChipProductDetail from "@/pages/chip/product-detail";
import ChipCustomers from "@/pages/chip/customers";
import ChipCustomerForm from "@/pages/chip/customer-form";
import ChipCustomerDetail from "@/pages/chip/customer-detail";
import ChipSuppliers from "@/pages/chip/suppliers";
import ChipSupplierForm from "@/pages/chip/supplier-form";
import ChipSupplierDetail from "@/pages/chip/supplier-detail";
import ChipPurchases from "@/pages/chip/purchases";
import ChipPurchaseForm from "@/pages/chip/purchase-form";
import ChipPurchaseDetail from "@/pages/chip/purchase-detail";
import ChipSales from "@/pages/chip/sales";
import ChipSaleForm from "@/pages/chip/sale-form";
import ChipSaleDetail from "@/pages/chip/sale-detail";
import ChipInvoices from "@/pages/chip/invoices";
import ChipInvoiceForm from "@/pages/chip/invoice-form";
import ChipInvoiceDetail from "@/pages/chip/invoice-detail";
import ChipExpenses from "@/pages/chip/expenses";
import ChipExpenseForm from "@/pages/chip/expense-form";
import ChipFinanceReport from "@/pages/chip/reports/finance";
import ChipProfitLossReport from "@/pages/chip/reports/profit-loss";
import ChipCashFlowReport from "@/pages/chip/reports/cash-flow";
import NotFound from "@/pages/not-found";

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
        <Route path="/compstyle/analytics-phase1" component={CompStyleAnalyticsPhase1} />
        <Route path="/compstyle/analytics-phase2" component={CompStyleAnalyticsPhase2} />
        <Route path="/compstyle/inventory-movement" component={CompStyleInventoryMovement} />
        <Route path="/compstyle/transit-tracking" component={TransitTracking} />
          <Route path="/compstyle/product-search" component={ProductSearch} />
        <Route path="/compstyle/sales-analysis" component={CompStyleSalesAnalysis} />
        <Route path="/compstyle/profitability" component={CompStyleProfitability} />
        <Route path="/compstyle/order-recommendations" component={CompStyleOrderRecommendations} />
        <Route path="/chip" component={ChipDashboard} />
        <Route path="/chip/products/new" component={ChipProductForm} />
        <Route path="/chip/products/:id/edit" component={ChipProductForm} />
        <Route path="/chip/products/:id" component={ChipProductDetail} />
        <Route path="/chip/products" component={ChipProducts} />
        <Route path="/chip/customers/new" component={ChipCustomerForm} />
        <Route path="/chip/customers/:id/edit" component={ChipCustomerForm} />
        <Route path="/chip/customers/:id" component={ChipCustomerDetail} />
        <Route path="/chip/customers" component={ChipCustomers} />
        <Route path="/chip/suppliers/new" component={ChipSupplierForm} />
        <Route path="/chip/suppliers/:id/edit" component={ChipSupplierForm} />
        <Route path="/chip/suppliers/:id" component={ChipSupplierDetail} />
        <Route path="/chip/suppliers" component={ChipSuppliers} />
        <Route path="/chip/purchases/new" component={ChipPurchaseForm} />
        <Route path="/chip/purchases/:id" component={ChipPurchaseDetail} />
        <Route path="/chip/purchases" component={ChipPurchases} />
        <Route path="/chip/sales/new" component={ChipSaleForm} />
        <Route path="/chip/sales/:id" component={ChipSaleDetail} />
        <Route path="/chip/sales" component={ChipSales} />
        <Route path="/chip/invoices/new" component={ChipInvoiceForm} />
        <Route path="/chip/invoices/:id" component={ChipInvoiceDetail} />
        <Route path="/chip/invoices" component={ChipInvoices} />
        <Route path="/chip/expenses/new" component={ChipExpenseForm} />
        <Route path="/chip/expenses" component={ChipExpenses} />
        <Route path="/chip/reports/finance" component={ChipFinanceReport} />
        <Route path="/chip/reports/profit-loss" component={ChipProfitLossReport} />
        <Route path="/chip/reports/cash-flow" component={ChipCashFlowReport} />
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