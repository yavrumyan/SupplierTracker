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
