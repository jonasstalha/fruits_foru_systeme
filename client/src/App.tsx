import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "./lib/protected-route";
import DashboardPage from "@/pages/dashboard-page";
import NewEntryPage from "@/pages/new-entry-page";
import ScanPage from "@/pages/scan-page";
import LotDetailPage from "@/pages/lot-detail-page";
import FarmsPage from "@/pages/farms-page";
import UsersPage from "@/pages/users-page";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/new-entry" component={NewEntryPage} />
      <ProtectedRoute path="/scan" component={ScanPage} />
      <ProtectedRoute path="/lots/:id" component={LotDetailPage} />
      <ProtectedRoute path="/farms" component={FarmsPage} />
      <ProtectedRoute path="/users" component={UsersPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

export default App;
