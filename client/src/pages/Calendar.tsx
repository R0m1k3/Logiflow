import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CalendarGrid from "@/components/CalendarGrid";
import { QuickCreateMenu } from "@/components/modals/QuickCreateMenu";
import { OrderDetailModal } from "@/components/modals/OrderDetailModal";
import { CreateOrderModal } from "@/components/modals/CreateOrderModal";
import { CreateDeliveryModal } from "@/components/modals/CreateDeliveryModal";
import StatsPanel from "@/components/StatsPanel";
import { useAuthUnified } from "@/hooks/useAuthUnified";
import { usePermissions } from "@/hooks/usePermissions";
import { useStore } from "@/components/Layout";

import { apiRequest } from "@/lib/queryClient";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import type { PublicityWithRelations } from "@shared/schema";

export default function Calendar() {
  const { user } = useAuthUnified();
  const { selectedStoreId } = useStore();
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date()); // Date actuelle
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [showCreateDelivery, setShowCreateDelivery] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showDayDetail, setShowDayDetail] = useState(false);
  const [selectedDayItems, setSelectedDayItems] = useState<{orders: any[], deliveries: any[], date: Date | null}>({orders: [], deliveries: [], date: null});

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Fetch orders and deliveries for the current month with store filtering
  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['/api/orders', selectedStoreId, { 
      startDate: format(monthStart, 'yyyy-MM-dd'), 
      endDate: format(monthEnd, 'yyyy-MM-dd') 
    }],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: format(monthStart, 'yyyy-MM-dd'),
        endDate: format(monthEnd, 'yyyy-MM-dd')
      });
      if (selectedStoreId && (user as any)?.role === 'admin') {
        params.append('storeId', selectedStoreId.toString());
      }
      
      const url = `/api/orders?${params.toString()}`;
      console.log('📅 Calendar fetching orders:', {
        url,
        selectedStoreId,
        userRole: (user as any)?.role,
        params: params.toString()
      });
      
      const response = await fetch(url, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const data = await response.json();
      console.log('📅 Calendar orders received:', Array.isArray(data) ? data.length : 'NOT_ARRAY', 'items');
      return data;
    },
  });

  const { data: deliveries = [], isLoading: loadingDeliveries } = useQuery({
    queryKey: ['/api/deliveries', selectedStoreId, { 
      startDate: format(monthStart, 'yyyy-MM-dd'), 
      endDate: format(monthEnd, 'yyyy-MM-dd') 
    }],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: format(monthStart, 'yyyy-MM-dd'),
        endDate: format(monthEnd, 'yyyy-MM-dd')
      });
      if (selectedStoreId && (user as any)?.role === 'admin') {
        params.append('storeId', selectedStoreId.toString());
      }
      
      const url = `/api/deliveries?${params.toString()}`;
      console.log('📅 Calendar fetching deliveries:', {
        url,
        selectedStoreId,
        userRole: (user as any)?.role,
        params: params.toString()
      });
      
      const response = await fetch(url, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch deliveries');
      }
      
      const data = await response.json();
      console.log('📅 Calendar deliveries received:', Array.isArray(data) ? data.length : 'NOT_ARRAY', 'items');
      return data;
    },
  });

  // Fetch publicities for the current month/year
  const { data: publicities = [], isLoading: loadingPublicities } = useQuery<PublicityWithRelations[]>({
    queryKey: ['/api/publicities', currentDate.getFullYear(), selectedStoreId],
    queryFn: async () => {
      const params = new URLSearchParams({
        year: currentDate.getFullYear().toString()
      });
      if (selectedStoreId && (user as any)?.role === 'admin') {
        params.append('storeId', selectedStoreId.toString());
      }
      
      const url = `/api/publicities?${params.toString()}`;
      console.log('📅 Calendar fetching publicities:', {
        url,
        year: currentDate.getFullYear(),
        selectedStoreId,
        userRole: (user as any)?.role
      });
      
      const response = await fetch(url, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch publicities');
      }
      
      const data = await response.json();
      console.log('📅 Calendar publicities received:', Array.isArray(data) ? data.length : 'NOT_ARRAY', 'items');
      return Array.isArray(data) ? data : [];
    },
  });

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleDateClick = (date: Date) => {
    console.log('📅 Date clicked:', format(date, 'yyyy-MM-dd'));
    console.log('📅 Current user:', (user as any)?.username, 'Role:', (user as any)?.role);
    console.log('📅 Permission check result:', hasPermission('calendar_read'));
    console.log('📅 All permissions available:', typeof hasPermission);
    
    // 🔧 FIX TOUS RÔLES - Autoriser tous les rôles à cliquer sur calendrier même si hasPermission échoue
    const isAdmin = user && (user as any).role === 'admin';
    const isManager = user && (user as any).role === 'manager';
    const isEmployee = user && (user as any).role === 'employee';
    const isDirecteur = user && (user as any).role === 'directeur';
    const hasCalendarAccess = isAdmin || isManager || isEmployee || isDirecteur || hasPermission('calendar_read');
    
    if (!hasCalendarAccess) {
      console.log('❌ No calendar permission');
      return;
    }
    
    console.log('✅ Opening quick create menu');
    setSelectedDate(date);
    setShowQuickCreate(true);
  };

  const handleItemClick = (item: any, type: 'order' | 'delivery') => {
    // Rafraîchir les données avant d'ouvrir le modal pour s'assurer d'avoir les liaisons à jour
    queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    queryClient.invalidateQueries({ queryKey: ['/api/orders', selectedStoreId] });
    queryClient.invalidateQueries({ queryKey: ['/api/deliveries'] });
    queryClient.invalidateQueries({ queryKey: ['/api/deliveries', selectedStoreId] });
    
    setSelectedItem({ ...item, type });
    setShowOrderDetail(true);
  };

  const handleCreateOrder = () => {
    setShowQuickCreate(false);
    setShowCreateOrder(true);
  };

  const handleCreateDelivery = () => {
    setShowQuickCreate(false);
    setShowCreateDelivery(true);
  };

  const handleShowDayDetail = (date: Date, dayOrders: any[], dayDeliveries: any[]) => {
    console.log('🔍 Opening day detail modal:', {
      date: format(date, 'yyyy-MM-dd'),
      ordersCount: dayOrders.length,
      deliveriesCount: dayDeliveries.length
    });
    
    setSelectedDayItems({
      orders: dayOrders,
      deliveries: dayDeliveries,
      date
    });
    setShowDayDetail(true);
  };

  const isLoading = loadingOrders || loadingDeliveries || loadingPublicities;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CalendarIcon className="w-8 h-8 text-primary mr-3" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Calendrier des Commandes & Livraisons
              </h2>
              <p className="text-gray-600">
                {format(currentDate, 'MMMM yyyy', { locale: fr })}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Legend */}
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-primary rounded"></div>
                <span className="text-gray-600">Commandes</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-secondary rounded"></div>
                <span className="text-gray-600">Livraisons</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-delivered rounded"></div>
                <span className="text-gray-600">Livré</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="p-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="text-xl font-semibold text-gray-900">
              {format(currentDate, 'MMMM yyyy', { locale: fr })}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="p-2"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          {(hasPermission('orders_create') || hasPermission('deliveries_create')) && (
            <Button
              onClick={() => setShowQuickCreate(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau
            </Button>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 p-6 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <CalendarGrid
            currentDate={currentDate}
            orders={orders}
            deliveries={deliveries}
            publicities={publicities}
            userRole={(user as any)?.role || 'employee'}
            userGroups={(user as any)?.userGroups || []}
            onDateClick={handleDateClick}
            onItemClick={handleItemClick}
            onShowDayDetail={handleShowDayDetail}
          />
        )}
      </div>

      {/* Modals */}
      {showQuickCreate && (
        <QuickCreateMenu
          isOpen={showQuickCreate}
          onClose={() => setShowQuickCreate(false)}
          onCreateOrder={handleCreateOrder}
          onCreateDelivery={handleCreateDelivery}
        />
      )}

      {showOrderDetail && selectedItem && (
        <OrderDetailModal
          isOpen={showOrderDetail}
          onClose={() => setShowOrderDetail(false)}
          item={selectedItem}
        />
      )}

      {showCreateOrder && (
        <CreateOrderModal
          isOpen={showCreateOrder}
          onClose={() => setShowCreateOrder(false)}
          selectedDate={selectedDate}
        />
      )}

      {showCreateDelivery && (
        <CreateDeliveryModal
          isOpen={showCreateDelivery}
          onClose={() => setShowCreateDelivery(false)}
          selectedDate={selectedDate}
        />
      )}

      {/* Day Detail Modal */}
      {showDayDetail && (
        <Dialog open={showDayDetail} onOpenChange={setShowDayDetail}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Détail du {selectedDayItems.date ? format(selectedDayItems.date, 'dd MMMM yyyy', { locale: fr }) : ''}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Orders Section */}
              {selectedDayItems.orders.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary rounded"></div>
                    Commandes ({selectedDayItems.orders.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedDayItems.orders.map((order: any) => {
                      // Vérifier si cette commande planifiée est liée à une livraison validée
                      const isLinkedToDeliveredDelivery = order.status === 'planned' && 
                        selectedDayItems.deliveries.some((delivery: any) => 
                          delivery.orderId === order.id && delivery.status === 'delivered'
                        );
                      
                      const cardBgClass = order.status === 'delivered' || isLinkedToDeliveredDelivery
                        ? 'bg-gray-100' // Fond gris très clair
                        : order.status === 'planned'
                        ? 'bg-yellow-50' // Fond jaune très clair
                        : 'bg-blue-50'; // Fond bleu très clair
                      
                      return (
                        <div
                          key={order.id}
                          className={`p-3 border rounded-lg hover:bg-gray-100 cursor-pointer transition-colors ${cardBgClass}`}
                          onClick={() => {
                            setShowDayDetail(false);
                            handleItemClick(order, 'order');
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: order.group?.color }}
                              />
                              <div className={order.status === 'delivered' || isLinkedToDeliveredDelivery ? 'line-through text-gray-600' : ''}>
                                <p className="font-medium">
                                  {order.supplier?.name || 'Fournisseur inconnu'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {order.group?.name} • {order.quantity} {order.unit}
                                </p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              order.status === 'delivered' || isLinkedToDeliveredDelivery ? 'bg-gray-200 text-gray-600' :
                              order.status === 'planned' ? 'bg-yellow-200 text-yellow-800' :
                              'bg-blue-200 text-blue-800'
                            }`}>
                              {order.status === 'delivered' || isLinkedToDeliveredDelivery ? 'Livré' :
                               order.status === 'planned' ? 'Planifié' : 'En attente'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Deliveries Section */}
              {selectedDayItems.deliveries.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-3 h-3 bg-secondary rounded"></div>
                    Livraisons ({selectedDayItems.deliveries.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedDayItems.deliveries.map((delivery: any) => {
                      const cardBgClass = delivery.status === 'delivered' 
                        ? 'bg-gray-100' // Fond gris très clair
                        : delivery.status === 'pending'
                        ? 'bg-yellow-50' // Fond jaune très clair 
                        : 'bg-blue-50'; // Fond bleu très clair
                      
                      return (
                        <div
                          key={delivery.id}
                          className={`p-3 border rounded-lg hover:bg-gray-100 cursor-pointer transition-colors ${cardBgClass}`}
                          onClick={() => {
                            setShowDayDetail(false);
                            handleItemClick(delivery, 'delivery');
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: delivery.group?.color }}
                              />
                              <div className={delivery.status === 'delivered' ? 'line-through text-gray-600' : ''}>
                                <p className="font-medium">
                                  {delivery.supplier?.name || 'Fournisseur inconnu'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {delivery.group?.name} • {delivery.quantity} {delivery.unit}
                                </p>
                                {delivery.order && (
                                  <p className="text-xs text-blue-600">
                                    Liée à la commande #{delivery.order.id}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              delivery.status === 'delivered' ? 'bg-gray-200 text-gray-600' :
                              delivery.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                              'bg-blue-200 text-blue-800'
                            }`}>
                              {delivery.status === 'delivered' ? 'Livré' :
                               delivery.status === 'pending' ? 'En attente' : 'Planifié'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {selectedDayItems.orders.length === 0 && selectedDayItems.deliveries.length === 0 && (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Aucune commande ou livraison ce jour-là</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Stats Panel */}
      <StatsPanel />
    </div>
  );
}
