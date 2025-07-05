import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { CategoriesBrandsProvider } from "@/lib/categories-brands-context";
import { useAuth } from "@/hooks/useAuth";
import Home from "@/pages/home";
import Landing from "@/pages/landing";
import Suppliers from "@/pages/suppliers";
import SupplierDetail from "@/pages/supplier-detail";
import AddSupplier from "@/pages/add-supplier";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Layout>
            <Route path="/" component={Home} />
            <Route path="/suppliers" component={Suppliers} />
            <Route path="/suppliers/:id" component={SupplierDetail} />
            <Route path="/add-supplier" component={AddSupplier} />
            <Route component={NotFound} />
          </Layout>
        </>
      )}
    </Switch>
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
