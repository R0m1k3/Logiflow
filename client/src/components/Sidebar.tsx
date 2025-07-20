import { Link, useLocation } from "wouter";
import { useAuthSimple } from "@/hooks/useAuthSimple";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
  Shield,
  Database,
  ShoppingCart,
  Clock,
  ListTodo
} from "lucide-react";

export default function Sidebar() {
  const { user, isLoading, error } = useAuthSimple();
  const [location] = useLocation();

  // Debug logging pour production
  console.log('Sidebar - User:', user);
  console.log('Sidebar - isLoading:', isLoading);
  console.log('Sidebar - error:', error);

  const handleLogout = async () => {
    try {
      // Force logout via fetch to ensure session is destroyed
      await fetch('/api/logout', { 
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Force redirect to auth page regardless of API response
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
      permission: "dashboard_read" // Calendrier fait partie du dashboard
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
      permission: "deliveries_read" // Rapprochement lié aux livraisons
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
      permission: "suppliers_read" 
    },
    { 
      path: "/groups", 
      label: "Magasins", 
      icon: Users, 
      permission: "groups_read" 
    },
  ];

  const adminItems = [
    { 
      path: "/users", 
      label: "Utilisateurs", 
      icon: UserCog, 
      permission: "users_read" 
    },
    { 
      path: "/roles", 
      label: "Gestion des Rôles", 
      icon: Shield, 
      permission: "roles_read" 
    },
    { 
      path: "/nocodb-config", 
      label: "Configuration NocoDB", 
      icon: Database, 
      permission: "system_admin" 
    },
  ];

  // Récupérer les permissions de l'utilisateur dynamiquement
  const { data: userPermissions = [], isLoading: permissionsLoading, error: permissionsError } = useQuery({
    queryKey: ['/api/user/permissions'],
    queryFn: async () => {
      console.log('🔍 Fetching user permissions for user:', user?.username, user?.role);
      const response = await fetch('/api/user/permissions', { 
        credentials: 'include',
        cache: 'no-cache' 
      });
      if (!response.ok) {
        console.error('❌ Failed to fetch user permissions:', response.status, response.statusText);
        return [];
      }
      const permissions = await response.json();
      console.log('✅ User permissions loaded:', permissions.length, 'for role:', user?.role);
      console.log('📋 First 3 permissions:', permissions.slice(0, 3).map((p: any) => p.name || p.permission?.name));
      return permissions;
    },
    enabled: !!user && !isLoading,
    staleTime: 1000, // 1 second pour debug
    refetchOnWindowFocus: false,
    retry: 3,
    refetchInterval: false
  });

  // Fonction pour vérifier les permissions dynamiquement
  const hasPermission = (requiredPermission: string) => {
    // Si l'utilisateur n'est pas chargé, ne pas afficher les menus
    if (!user) {
      console.log('❌ Permission check failed: no user');
      return false;
    }
    
    // Admin a toujours accès
    if (user.role === 'admin') {
      console.log('✅ Admin user - permission granted:', requiredPermission);
      return true;
    }
    
    // Si les permissions sont en cours de chargement, ne pas afficher les menus (sauf admin)
    if (permissionsLoading) {
      console.log('⏳ Permissions loading for:', user.role, requiredPermission);
      return false;
    }
    
    // Si erreur de chargement des permissions, ne pas afficher
    if (permissionsError) {
      console.log('❌ Permissions error:', permissionsError, 'for:', requiredPermission);
      return false;
    }
    
    // Si pas de permissions chargées pour un non-admin, ne pas afficher
    if (!userPermissions || userPermissions.length === 0) {
      console.log('❌ No permissions loaded for role:', user.role, 'required:', requiredPermission);
      return false;
    }
    
    // Vérifier si l'utilisateur a la permission spécifique
    const hasSpecificPermission = userPermissions.some((perm: any) => 
      perm.name === requiredPermission || perm.permission?.name === requiredPermission
    );
    
    const result = {
      requiredPermission, 
      userRole: user?.role, 
      hasSpecificPermission,
      totalPermissions: userPermissions.length,
      permissionsLoading,
      permissionsError: !!permissionsError
    };
    
    console.log(hasSpecificPermission ? '✅' : '❌', 'Permission check:', result);
    
    return hasSpecificPermission;
  };



  // Si l'utilisateur ou les permissions se chargent, afficher un état de chargement
  if (isLoading || permissionsLoading) {
    return (
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-lg">
        <div className="h-16 flex items-center justify-center border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <Store className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-semibold text-gray-900">LogiFlow</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">
              {isLoading ? 'Connexion...' : 'Chargement permissions...'}
            </p>
          </div>
        </div>
      </aside>
    );
  }

  // Si l'utilisateur n'est pas authentifié, afficher seulement le logo
  if (!user) {
    return (
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-lg">
        <div className="h-16 flex items-center justify-center border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <Store className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-semibold text-gray-900">LogiFlow</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p>Authentification requise</p>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-lg">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <Store className="h-6 w-6 text-blue-600" />
          <span className="text-lg font-semibold text-gray-900">LogiFlow</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const hasRequiredPermission = hasPermission(item.permission);
            
            if (!hasRequiredPermission) return null;
            
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={`flex items-center px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 ${
                    active
                      ? 'bg-gray-100 text-gray-900 border-r-2 border-gray-700'
                      : 'text-gray-700'
                  }`}
                  onClick={() => console.log(`Navigating to: ${item.path}`)}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Management Section */}
        {managementItems.some(item => hasPermission(item.permission)) && (
          <>
            <div className="mt-6 mb-2">
              <h3 className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gestion
              </h3>
            </div>
            <div className="space-y-1">
              {managementItems.map((item) => {
                if (!hasPermission(item.permission)) return null;
                
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <Link key={item.path} href={item.path}>
                    <div
                      className={`flex items-center px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 ${
                        active
                          ? 'bg-gray-100 text-gray-900 border-r-2 border-gray-700'
                          : 'text-gray-700'
                      }`}
                      onClick={() => console.log(`Navigating to management: ${item.path}`)}
                    >
                      <Icon className="mr-3 h-4 w-4" />
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </nav>

      {/* Administration Section */}
      {adminItems.some(item => hasPermission(item.permission)) && (
        <div className="border-t border-gray-200 py-4 px-3">
          <div className="mb-2">
            <h3 className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Administration
            </h3>
          </div>
          <div className="space-y-1">
            {adminItems.map((item) => {
              if (!hasPermission(item.permission)) return null;
              
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <Link key={item.path} href={item.path}>
                  <div
                    className={`flex items-center px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 ${
                      active
                        ? 'bg-gray-100 text-gray-900 border-r-2 border-gray-700'
                        : 'text-gray-700'
                    }`}
                    onClick={() => console.log(`Navigating to admin: ${item.path}`)}
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* User Profile & Logout */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="h-8 w-8 bg-gray-100 flex items-center justify-center rounded-full">
            <span className="text-xs font-medium text-gray-700">
              {getInitials(user?.firstName, user?.lastName, user?.username)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {(() => {
                if (user?.firstName && user?.lastName) {
                  return `${user.firstName} ${user.lastName}`;
                }
                if (user?.firstName && user.firstName.trim()) {
                  return user.firstName;
                }
                if (user?.lastName && user.lastName.trim()) {
                  return user.lastName;
                }
                return user?.username || 'Utilisateur';
              })()}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email || user?.username}
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
      </div>
    </aside>
  );
}
