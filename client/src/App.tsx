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
      <Route path="/" component={DashboardPage} />
      <Route path="/new-entry" component={NewEntryPage} />
      <Route path="/scan" component={ScanPage} />
      <Route path="/lots/:id" component={LotDetailPage} />
      <Route path="/farms" component={FarmsPage} />
      <Route path="/users" component={UsersPage} />
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
