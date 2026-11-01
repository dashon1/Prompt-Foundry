import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ServiceStatus } from "@/components/ServiceStatus";
import Home from "@/pages/Home";
import Generators from "@/pages/Generators";
import Playground from "@/pages/Playground";
import API from "@/pages/API";
import History from "@/pages/History";
import Dashboard from "@/pages/Dashboard";
import Community from "@/pages/Community";
import Compare from "@/pages/Compare";
import ApiKeys from "@/pages/ApiKeys";
import SharedPrompt from "@/pages/SharedPrompt";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/generators" component={Generators} />
      <Route path="/playground" component={Playground} />
      <Route path="/api" component={API} />
      <Route path="/history" component={History} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/community" component={Community} />
      <Route path="/compare" component={Compare} />
      <Route path="/api-keys" component={ApiKeys} />
      <Route path="/share/:shareId" component={SharedPrompt} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex flex-col min-h-screen">
          <Header />
          <ServiceStatus />
          <main className="flex-1">
            <Router />
          </main>
          <Footer />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
