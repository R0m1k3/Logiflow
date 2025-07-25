import { Link, useLocation } from "wouter";
import { useAuthUnified } from "@/hooks/useAuthUnified";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { 
  Store, 
  Calendar, 
  BarChart3, 
  Package, 
  Truck, 
  Building, 
  Users, 
  UserCog, 
  LogOut,
  FileText,
  Megaphone,
  Database,
  ShoppingCart,
  Clock,
  ListTodo,
  Menu,
  ChevronLeft,
  Search
} from "lucide-react";

export default function Sidebar() {
  const { user, isLoading: userLoading, error } = useAuthUnified();
  const { hasPermission, isLoading: permissionsLoading, userPermissions } = usePermissions();
  const [location] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isLoading = userLoading || permissionsLoading;

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { 
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      window.location.href = "/auth";
    }
  };

  const getInitials = (firstName?: string, lastName?: string, username?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName[0].toUpperCase();
    }
    if (lastName) {
      return lastName[0].toUpperCase();
    }
    if (username && username.length >= 2) {
      return username.substring(0, 2).toUpperCase();
    }
    if (username) {
      return username[0].toUpperCase();
    }
    return "U";
  };

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const menuItems = [
    { 
      path: "/dashboard", 
      label: "Tableau de bord", 
      icon: BarChart3, 
      permission: "dashboard_read" 
    },
    { 
      path: "/calendar", 
      label: "Calendrier", 
      icon: Calendar, 
      permission: "calendar_read"
    },
    { 
      path: "/orders", 
      label: "Commandes", 
      icon: Package, 
      permission: "orders_read" 
    },
    { 
      path: "/deliveries", 
      label: "Livraisons", 
      icon: Truck, 
      permission: "deliveries_read" 
    },
    { 
      path: "/bl-reconciliation", 
      label: "Rapprochement", 
      icon: FileText, 
      permission: "reconciliation_read" 
    },
    { 
      path: "/publicities", 
      label: "Publicités", 
      icon: Megaphone, 
      permission: "publicities_read" 
    },
    { 
      path: "/customer-orders", 
      label: "Commandes Client", 
      icon: ShoppingCart, 
      permission: "customer_orders_read" 
    },
    { 
      path: "/dlc", 
      label: "Gestion DLC", 
      icon: Clock, 
      permission: "dlc_read" 
    },
    { 
      path: "/tasks", 
      label: "Tâches", 
      icon: ListTodo, 
      permission: "tasks_read" 
    },
  ];

  const managementItems = [
    { 
      path: "/suppliers", 
      label: "Fournisseurs", 
      icon: Building, 
      permission: "system_admin" // ADMIN UNIQUEMENT - Pas d'accès Gestion pour Directeur/Manager
    },
    { 
      path: "/groups", 
      label: "Magasins", 
      icon: Users, 
      permission: "system_admin" // ADMIN UNIQUEMENT - Pas d'accès Gestion pour Directeur/Manager
    },
  ];

  const adminItems = [
    { 
      path: "/users", 
      label: "Utilisateurs", 
      icon: UserCog, 
      permission: "system_admin" // ADMIN UNIQUEMENT - Pas d'accès Administration pour Directeur/Manager
    },
    { 
      path: "/database-backup", 
      label: "Sauvegarde BDD", 
      icon: Database, 
      permission: "system_admin" 
    },
    { 
      path: "/nocodb-config", 
      label: "Configuration NocoDB", 
      icon: Database, 
      permission: "system_admin" 
    },
    { 
      path: "/nocodb-diagnostic", 
      label: "Diagnostic NocoDB", 
      icon: Search, 
      permission: "system_admin" 
    },
  ];

  if (isLoading) {
    return (
      <aside className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 flex flex-col shadow-lg transition-all duration-300`}>
        <div className="h-16 flex items-center justify-center border-b border-gray-200 bg-white">
          {isCollapsed ? (
            <Store className="h-6 w-6 text-blue-600" />
          ) : (
            <div className="flex items-center space-x-3">
              <Store className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">LogiFlow</span>
            </div>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            {isCollapsed ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            ) : (
              <p>Chargement...</p>
            )}
          </div>
        </div>
      </aside>
    );
  }

  if (error || !user) {
    return (
      <aside className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 flex flex-col shadow-lg transition-all duration-300`}>
        <div className="h-16 flex items-center justify-center border-b border-gray-200 bg-white">
          {isCollapsed ? (
            <Store className="h-6 w-6 text-blue-600" />
          ) : (
            <div className="flex items-center space-x-3">
              <Store className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">LogiFlow</span>
            </div>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            {isCollapsed ? (
              <LogOut className="h-4 w-4" />
            ) : (
              <p>Authentification requise</p>
            )}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 flex flex-col shadow-lg transition-all duration-300`}>
      {/* Logo & Toggle Button */}
      <div className="h-16 flex items-center justify-between border-b border-gray-200 bg-white px-3">
        {isCollapsed ? (
          <Store className="h-6 w-6 text-blue-600 mx-auto" />
        ) : (
          <div className="flex items-center space-x-3">
            <Store className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-semibold text-gray-900">LogiFlow</span>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0 hover:bg-gray-100"
          title={isCollapsed ? "Agrandir la sidebar" : "Réduire la sidebar"}
        >
          {isCollapsed ? (
            <Menu className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3">
        <div className="space-y-1">
          {menuItems.map((item) => {
            // 🔧 FIX TOUS RÔLES - Employé exclu de calendrier, commandes, livraisons, rapprochement
            const isAdmin = user && (user as any).role === 'admin';
            const isManager = user && (user as any).role === 'manager';
            const isEmployee = user && (user as any).role === 'employee';
            const isDirecteur = user && (user as any).role === 'directeur';
            
            // Spécifications: Employé ne voit pas calendrier, commandes, livraisons, rapprochement
            if (isEmployee && (item.path === '/calendar' || item.path === '/orders' || item.path === '/deliveries' || item.path === '/bl-reconciliation')) {
              return null;
            }
            
            // Spécifications: Manager ne voit pas rapprochement (Admin/Directeur uniquement)
            if (isManager && item.path === '/bl-reconciliation') {
              return null;
            }
            
            const shouldShow = isAdmin || isManager || isEmployee || isDirecteur || hasPermission(item.permission);
            
            if (!shouldShow) return null;
            
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={`flex items-center px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 ${
                    active
                      ? 'bg-gray-100 text-gray-900 border-r-2 border-gray-700'
                      : 'text-gray-700'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon className={`h-4 w-4 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && item.label}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Management Section - ADMIN UNIQUEMENT */}
        {(function() {
          const isAdmin = user && (user as any).role === 'admin';
          // ⚠️ SPÉCIFICATION: Seul admin a accès aux sections Gestion et Administration
          return isAdmin;
        })() && (
          <>
            {!isCollapsed && (
              <div className="mt-6 mb-2">
                <h3 className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gestion
                </h3>
              </div>
            )}
            <div className={`space-y-1 ${isCollapsed ? 'mt-6' : ''}`}>
              {managementItems.map((item) => {
                // 🔧 FIX ADMIN - Pour admin, toujours afficher les menus gestion (déjà filtré par section)
                const isAdmin = user && (user as any).role === 'admin';
                const shouldShow = isAdmin; // Toujours true car section déjà filtrée admin uniquement
                
                if (!shouldShow) return null;
                
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <Link key={item.path} href={item.path}>
                    <div
                      className={`flex items-center px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 ${
                        active
                          ? 'bg-gray-100 text-gray-900 border-r-2 border-gray-700'
                          : 'text-gray-700'
                      } ${isCollapsed ? 'justify-center' : ''}`}
                      title={isCollapsed ? item.label : ''}
                    >
                      <Icon className={`h-4 w-4 ${isCollapsed ? '' : 'mr-3'}`} />
                      {!isCollapsed && item.label}
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </nav>

      {/* Administration Section - ADMIN UNIQUEMENT */}
      {(function() {
        const isAdmin = user && (user as any).role === 'admin';
        // ⚠️ SPÉCIFICATION: Seul admin a accès aux sections Gestion et Administration
        return isAdmin;
      })() && (
        <div className="border-t border-gray-200 py-4 px-3">
          {!isCollapsed && (
            <div className="mb-2">
              <h3 className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Administration
              </h3>
            </div>
          )}
          <div className="space-y-1">
            {adminItems.map((item) => {
              // 🔧 FIX ADMIN - Pour admin, toujours afficher les menus administration (déjà filtré par section)
              const isAdmin = user && (user as any).role === 'admin';
              const shouldShow = isAdmin; // Toujours true car section déjà filtrée admin uniquement
              
              if (!shouldShow) return null;
              
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <Link key={item.path} href={item.path}>
                  <div
                    className={`flex items-center px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 ${
                      active
                        ? 'bg-gray-100 text-gray-900 border-r-2 border-gray-700'
                        : 'text-gray-700'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                    title={isCollapsed ? item.label : ''}
                  >
                    <Icon className={`h-4 w-4 ${isCollapsed ? '' : 'mr-3'}`} />
                    {!isCollapsed && item.label}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* User Profile & Logout */}
      <div className="border-t border-gray-200 p-4">
        {isCollapsed ? (
          // Mode collapsed : seulement initiales et bouton logout en icône
          <div className="flex flex-col items-center space-y-3">
            <div className="h-8 w-8 bg-gray-100 flex items-center justify-center rounded-full" title={(() => {
              const u = user as any;
              // Prioriser le prénom s'il existe
              if (u?.firstName && u.firstName.trim()) {
                return u.firstName;
              }
              // Sinon prénom + nom si les deux existent
              if (u?.firstName && u?.lastName) {
                return `${u.firstName} ${u.lastName}`;
              }
              // Sinon nom seul
              if (u?.lastName && u.lastName.trim()) {
                return u.lastName;
              }
              // Fallback sur username
              return u?.username || 'Utilisateur';
            })()}>
              <span className="text-xs font-medium text-gray-700">
                {getInitials((user as any)?.firstName, (user as any)?.lastName, (user as any)?.username)}
              </span>
            </div>
            
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 hover:text-red-600 hover:border-red-300"
              title="Déconnexion"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          // Mode normal : profil complet
          <>
            <div className="flex items-center space-x-3 mb-3">
              <div className="h-8 w-8 bg-gray-100 flex items-center justify-center rounded-full">
                <span className="text-xs font-medium text-gray-700">
                  {getInitials((user as any)?.firstName, (user as any)?.lastName, (user as any)?.username)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {(() => {
                    const u = user as any;
                    // Prioriser le prénom s'il existe
                    if (u?.firstName && u.firstName.trim()) {
                      return u.firstName;
                    }
                    // Sinon prénom + nom si les deux existent
                    if (u?.firstName && u?.lastName) {
                      return `${u.firstName} ${u.lastName}`;
                    }
                    // Sinon nom seul
                    if (u?.lastName && u.lastName.trim()) {
                      return u.lastName;
                    }
                    // Fallback sur username
                    return u?.username || 'Utilisateur';
                  })()}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {(user as any)?.role === 'admin' ? 'Administrateur' :
                   (user as any)?.role === 'employee' ? 'Employé' :
                   (user as any)?.role === 'manager' ? 'Manager' :
                   (user as any)?.role === 'directeur' ? 'Directeur' :
                   (user as any)?.role}
                </p>
              </div>
            </div>
            
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="w-full justify-start text-gray-600 hover:text-red-600 hover:border-red-300"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </Button>
          </>
        )}
      </div>
    </aside>
  );
}