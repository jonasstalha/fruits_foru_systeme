import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "@/components/protected-route";
import DashboardPage from "./pages/dashboard-page";
import NewEntryPage from "@/pages/new-entry-page";
import ScanPage from "@/pages/scan-page";
import LotDetailPage from "@/pages/lot-detail-page";
import FarmsPage from "@/pages/farms-page";
import UsersPage from "@/pages/users-page";
import WarehousesPage from "@/pages/warehouses-page";
import LotsPage from "@/pages/lots-page";
import ReportsPage from "@/pages/reports-page";
import StatisticsPage from "@/pages/statistics-page";
import MainLayout from "@/components/layout/main-layout";
import { LoginPage } from "@/pages/login-page";
import { AuthProvider } from "@/components/auth-provider";
import RapportGenerating from "./pages/logistique/rapport-generating";
import facturestemplates from "./pages/logistique/factures-templates";
import inventory from "./pages/logistique/inventory";
import qualitycontrol from "./pages/quality/qualitycontrol";
import personnelmanagement from "./pages/personnele/personnelmanagement";
import calculedeconsomation from "./pages/production/calculedeconsomation";
import history from "./pages/logistique/history";
import reception from "./pages/recaption/reception";
import newEntry from "./pages/recaption/newentry";
import Horaires from "./pages/personnele/Horaires";
import historiquedeconsomation from "./pages/production/historiquedeconsomation";
import Archivagedesfacture from "@/pages/comptability/Archivagedesfacture"
import templatest from "@/pages/comptability/templatest";
import FichedExpidition from "@/pages/logistique/FichedExpidition";
import Rapportqualité from "@/pages/quality/Rapportqualité";
import Archivagedescontroles from "@/pages/quality/Archivagedescontroles";

function AuthenticatedRoutes() {
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/new-entry" component={NewEntryPage} />
        <Route path="/scan" component={ScanPage} />
        <Route path="/lots" component={LotsPage} />
        <Route path="/lots/:id" component={LotDetailPage} />
        <Route path="/farms" component={FarmsPage} />
        <Route path="/users" component={UsersPage} />
        <Route path="/warehouses" component={WarehousesPage} />
        <Route path="/reports" component={ReportsPage} />
        {/* <Route path="/statistics" component={StatisticsPage} /> */}
        <Route path="/rapport-generating" component={RapportGenerating} />
        <Route path="/factures-templates" component={facturestemplates} />
        <Route path="/traceability" component={StatisticsPage} />
        <Route path="/inventory" component={inventory} />
        <Route path="/qualitycontrol" component={qualitycontrol} />
        <Route path="/personnelmanagement" component={personnelmanagement} />
        <Route path="/calculedeconsomation" component={calculedeconsomation} />
        <Route path="/history" component={history} />
        <Route path="/reception" component={reception} />
        <Route path="/new" component={newEntry} />
        <Route path="/schedules" component={Horaires} />
        <Route path="/historiquedeconsomation" component={historiquedeconsomation} />
        <Route path="/Archivagedesfacture" component={Archivagedesfacture} />
        <Route path="/Templates" component={templatest} />
        <Route path="/fichedexpidition" component={FichedExpidition} />
        <Route path="/Rapportqualité" component={Rapportqualité} />
        <Route path="/Archivagedescontroles" component={Archivagedescontroles} />
        {/* Add more routes here as needed */}
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route>
          <ProtectedRoute>
            <AuthenticatedRoutes />
          </ProtectedRoute>
        </Route>
      </Switch>
      <Toaster />
      <SonnerToaster position="top-right" />
    </AuthProvider>
  );
}

export default App;
