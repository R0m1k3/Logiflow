import { Switch, Route } from "wouter";
import { useAuthUnified } from "@/hooks/useAuthUnified";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import Calendar from "@/pages/Calendar";
import Orders from "@/pages/Orders";
import Deliveries from "@/pages/Deliveries";
import Suppliers from "@/pages/Suppliers";
import Groups from "@/pages/Groups";
import Users from "@/pages/Users";
import BLReconciliation from "@/pages/BLReconciliation";
import Publicities from "@/pages/Publicities";

import NocoDBConfig from "@/pages/NocoDBConfig";
import NocoDBDiagnostic from "@/pages/NocoDBDiagnostic";
import CustomerOrders from "@/pages/CustomerOrders";

import DlcPage from "@/pages/DlcPage";
import Tasks from "@/pages/Tasks";
import TasksSimplified from "@/pages/TasksSimplified";
import DatabaseBackup from "@/pages/DatabaseBackup";
import WebhookConfiguration from "@/pages/WebhookConfiguration";
import Layout from "@/components/Layout";

function RouterProduction() {
  try {
    const { isAuthenticated, isLoading, user, environment, error } = useAuthUnified();
    
    if (isLoading) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-surface">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <Switch>
          <Route path="/auth" component={AuthPage} />
          <Route component={AuthPage} />
        </Switch>
      );
    }

    return (
      <Layout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/calendar" component={Calendar} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/orders" component={Orders} />
          <Route path="/deliveries" component={Deliveries} />
          <Route path="/suppliers" component={Suppliers} />
          <Route path="/groups" component={Groups} />
          <Route path="/users" component={Users} />
          <Route path="/bl-reconciliation" component={BLReconciliation} />
          <Route path="/publicities" component={Publicities} />
          <Route path="/customer-orders" component={CustomerOrders} />
          <Route path="/dlc" component={DlcPage} />
          <Route path="/tasks" component={Tasks} />
          <Route path="/database-backup" component={DatabaseBackup} />
          <Route path="/webhook-configuration" component={WebhookConfiguration} />
          <Route path="/nocodb-config" component={NocoDBConfig} />
          <Route path="/nocodb-diagnostic" component={NocoDBDiagnostic} />
          <Route component={NotFound} />
        </Switch>
      </Layout>
    );
  } catch (error) {
    console.error('RouterProduction Error:', error);
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-surface">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Erreur de routage
          </h2>
          <p className="text-gray-600 mb-4">
            Une erreur s'est produite lors du chargement de l'application.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
          >
            Recharger la page
          </button>
        </div>
      </div>
    );
  }
}

export default RouterProduction;