import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, isWithinInterval, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { safeDate } from "@/lib/dateUtils";
import { Plus, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrderWithRelations, DeliveryWithRelations, PublicityWithRelations } from "@shared/schema";

interface CalendarGridProps {
  currentDate: Date;
  orders: OrderWithRelations[];
  deliveries: DeliveryWithRelations[];
  publicities: PublicityWithRelations[];
  userRole: string;
  userGroups?: { groupId: number; group: { id: number; name: string; color: string; } }[];
  onDateClick: (date: Date) => void;
  onItemClick: (item: any, type: 'order' | 'delivery') => void;
  onShowDayDetail?: (date: Date, orders: any[], deliveries: any[]) => void;
}

export default function CalendarGrid({
  currentDate,
  orders,
  deliveries,
  publicities,
  userRole,
  userGroups = [],
  onDateClick,
  onItemClick,
  onShowDayDetail,
}: CalendarGridProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Get all days in the month
  const monthDays = eachDayOfInterval({
    start: monthStart,
    end: monthEnd,
  });

  // Pad the calendar to start on Monday
  const firstDayOfWeek = monthStart.getDay();
  const startPadding = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const paddedDays = [];

  // Add padding days from previous month
  for (let i = startPadding; i > 0; i--) {
    const paddingDate = new Date(monthStart);
    paddingDate.setDate(paddingDate.getDate() - i);
    paddedDays.push(paddingDate);
  }

  // Add current month days
  paddedDays.push(...monthDays);

  // Add padding days from next month to complete the grid
  const remainingCells = 42 - paddedDays.length; // 6 weeks * 7 days
  for (let i = 1; i <= remainingCells; i++) {
    const paddingDate = new Date(monthEnd);
    paddingDate.setDate(paddingDate.getDate() + i);
    paddedDays.push(paddingDate);
  }

  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  const getItemsForDate = (date: Date) => {
    // Debug: Log des commandes reçues (seulement une fois)
    if (orders.length > 0 && date.getDate() === 1) {
      console.log('📅 CalendarGrid Debug - Orders received:', orders.length);
      console.log('📅 First order structure:', orders[0]);
      console.log('📅 All orders dates:', orders.map(o => ({ id: o.id, plannedDate: o.plannedDate, supplier: o.supplier?.name })));
    }
    
    // Debug: Log des livraisons reçues (seulement une fois)
    if (deliveries.length > 0 && date.getDate() === 1) {
      console.log('🚛 CalendarGrid Debug - Deliveries received:', deliveries.length);
      console.log('🚛 First delivery structure:', deliveries[0]);
      console.log('🚛 All deliveries dates:', deliveries.map(d => ({ id: d.id, scheduledDate: d.scheduledDate, supplier: d.supplier?.name })));
    }
    
    const dayOrders = orders.filter(order => {
      // Protection contre undefined/null
      if (!order || !order.supplier) {
        console.warn('📅 Invalid order found:', order);
        return false;
      }
      
      // Essayer plusieurs champs de date possibles
      const orderDate = safeDate(order.plannedDate || order.orderDate || order.createdAt);
      const matches = orderDate && isSameDay(orderDate, date);
      
      if (matches) {
        console.log('📅 Order matches date:', {
          orderId: order.id,
          supplier: order.supplier?.name,
          plannedDate: order.plannedDate,
          matchingDate: format(date, 'yyyy-MM-dd')
        });
      }
      
      return matches;
    });
    
    const dayDeliveries = deliveries.filter(delivery => {
      // Protection contre undefined/null
      if (!delivery || !delivery.supplier) {
        console.warn('🚛 Invalid delivery found:', delivery);
        return false;
      }
      
      // Essayer plusieurs champs de date possibles
      const deliveryDate = safeDate(delivery.scheduledDate || delivery.deliveryDate || delivery.createdAt);
      const matches = deliveryDate && isSameDay(deliveryDate, date);
      
      if (matches) {
        console.log('🚛 Delivery matches date:', {
          deliveryId: delivery.id,
          supplier: delivery.supplier?.name,
          scheduledDate: delivery.scheduledDate,
          matchingDate: format(date, 'yyyy-MM-dd')
        });
      }
      
      return matches;
    });
    
    return { orders: dayOrders, deliveries: dayDeliveries };
  };

  // Get publicities for a specific date
  const getPublicitiesForDate = (date: Date) => {
    if (!publicities || !Array.isArray(publicities)) return [];
    
    return publicities.filter(publicity => {
      if (!publicity.startDate || !publicity.endDate) return false;
      
      try {
        // Utiliser parseISO pour une compatibilité maximale
        const startDate = parseISO(publicity.startDate);
        const endDate = parseISO(publicity.endDate);
        
        // Créer une date normalisée pour la comparaison (minuit local)
        const currentDateNormalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        // Normaliser les dates de début et fin (minuit local)
        const startDateNormalized = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const endDateNormalized = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        
        const isWithinPeriod = currentDateNormalized >= startDateNormalized && currentDateNormalized <= endDateNormalized;
        
        // Debug logs pour diagnostiquer le problème  
        if (publicity.pubNumber && (
            publicity.pubNumber.includes('2512') || 
            publicity.pubNumber === 'FINAL-TEST' ||
            publicity.designation?.includes('Test Final')
        )) {
          console.log(`🎯 Publicity ${publicity.pubNumber} debug:`, {
            currentDate: format(currentDateNormalized, 'yyyy-MM-dd'),
            startDate: format(startDateNormalized, 'yyyy-MM-dd'),
            endDate: format(endDateNormalized, 'yyyy-MM-dd'),
            isWithinPeriod,
            originalStartDate: publicity.startDate,
            originalEndDate: publicity.endDate
          });
        }
        
        return isWithinPeriod;
      } catch (error) {
        console.warn('Error parsing publicity dates:', publicity);
        return false;
      }
    });
  };

  const formatQuantity = (quantity: number, unit: string) => {
    return `${quantity}${unit === 'palettes' ? 'P' : 'C'}`;
  };

  return (
    <div className="bg-white shadow-sm border border-gray-200 overflow-hidden">
      {/* Calendar Header */}
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
        {weekDays.map(day => (
          <div key={day} className="p-4 text-center text-sm font-medium text-gray-700">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7">
        {paddedDays.map((date, index) => {
          const isCurrentMonth = isSameMonth(date, currentDate);
          const isTodayDate = isToday(date);
          const { orders: dayOrders, deliveries: dayDeliveries } = getItemsForDate(date);
          const dayPublicities = getPublicitiesForDate(date);
          
          return (
            <div
              key={index}
              className={`h-32 border-r border-b border-gray-100 relative group cursor-pointer transition-colors ${
                isTodayDate
                  ? "bg-blue-50 hover:bg-blue-100 ring-1 ring-blue-200"
                  : isCurrentMonth
                  ? "bg-white hover:bg-gray-50"
                  : "bg-gray-50"
              }`}
              onClick={() => onDateClick(date)}
            >
              <div className="p-2">
                {/* Date and Publicities */}
                <div className="flex items-start justify-between">
                  <span className={`text-sm font-medium ${
                    isTodayDate 
                      ? "text-blue-700 font-semibold" 
                      : isCurrentMonth ? "text-gray-900" : "text-gray-400"
                  }`}>
                    {format(date, 'd')}
                  </span>
                  
                  {/* Publicities Display */}
                  {dayPublicities.length > 0 && (
                    <div className="flex flex-col items-end space-y-1">
                      {dayPublicities.map((publicity) => {
                        // Filter participations based on user role
                        let relevantParticipations = publicity.participations || [];
                        
                        // For ALL users (including admin): only show publicities that have participating stores
                        if (relevantParticipations.length === 0) {
                          return null; // Don't show publicity if no stores participate
                        }
                        
                        if (userRole !== 'admin') {
                          // For non-admin users, only show publicities where their store participates
                          const userGroupIds = userGroups.map(ug => ug.groupId);
                          relevantParticipations = relevantParticipations.filter(p => 
                            userGroupIds.includes(p.groupId)
                          );
                          
                          // Don't show publicity if user's store doesn't participate
                          if (relevantParticipations.length === 0) {
                            return null;
                          }
                        }
                        
                        return (
                          <div key={publicity.id} className="flex items-center space-x-1">
                            {/* Store color dots for admin */}
                            {userRole === 'admin' && relevantParticipations.length > 0 && (
                              <div className="flex space-x-1">
                                {relevantParticipations.map((participation, idx) => (
                                  <div
                                    key={idx}
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: participation.group?.color || '#666' }}
                                    title={participation.group?.name || 'Magasin'}
                                  />
                                ))}
                              </div>
                            )}
                            
                            {/* Publicity number */}
                            <span 
                              className="text-xs font-medium text-purple-600 bg-purple-100 px-1 rounded"
                              title={publicity.designation}
                            >
                              {publicity.pubNumber}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                {/* Orders and Deliveries */}
                <div className="mt-1 space-y-1">
                  {(() => {
                    const totalItems = dayOrders.length + dayDeliveries.length;
                    const maxVisibleItems = 2; // Limite à 2 éléments visibles par case
                    
                    // Si trop d'éléments, montrer seulement quelques-uns + icône loupe
                    if (totalItems > maxVisibleItems) {
                      const visibleOrders = dayOrders.slice(0, maxVisibleItems);
                      const visibleDeliveries = dayDeliveries.slice(0, Math.max(0, maxVisibleItems - dayOrders.length));
                      
                      return (
                        <>
                          {/* Afficher les commandes visibles */}
                          {visibleOrders.map((order) => {
                            const colorClass = order.status === 'delivered' 
                              ? 'bg-delivered text-white' 
                              : order.status === 'planned'
                              ? 'bg-orange-500 text-white border-2 border-orange-300'
                              : 'bg-primary text-white';
                            
                            return (
                              <div
                                key={`order-${order.id}`}
                                className={`text-xs px-2 py-1 flex items-center justify-between cursor-pointer ${colorClass}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onItemClick(order, 'order');
                                }}
                              >
                                <span className="truncate">
                                  {order.supplier.name}
                                </span>
                                <div className="flex items-center ml-1 flex-shrink-0">
                                  {order.status === 'planned' && (
                                    <span className="w-2 h-2 bg-yellow-300 mr-1" title="Commande planifiée (liée à une livraison)" />
                                  )}
                                  {order.status === 'delivered' && (
                                    <Check className="w-3 h-3" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          
                          {/* Afficher les livraisons visibles */}
                          {visibleDeliveries.map((delivery) => (
                            <div
                              key={`delivery-${delivery.id}`}
                              className={`text-xs px-2 py-1 flex items-center justify-between cursor-pointer ${
                                delivery.status === 'delivered' 
                                  ? 'bg-delivered text-white' 
                                  : delivery.status === 'pending'
                                  ? 'bg-yellow-500 text-white border-2 border-yellow-300'
                                  : 'bg-secondary text-white'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onItemClick(delivery, 'delivery');
                              }}
                            >
                              <span className="truncate">
                                {delivery.supplier.name} - {formatQuantity(delivery.quantity, delivery.unit)}
                              </span>
                              <div className="flex items-center ml-1 flex-shrink-0">
                                {delivery.status === 'pending' && (
                                  <span className="w-2 h-2 bg-orange-300 mr-1" title="En attente de validation" />
                                )}
                                {delivery.status === 'delivered' && (
                                  <Check className="w-3 h-3" />
                                )}
                              </div>
                            </div>
                          ))}
                          
                          {/* Bouton loupe pour voir tous les éléments */}
                          <div
                            className="flex items-center justify-center py-1 px-2 bg-gray-200 hover:bg-gray-300 cursor-pointer transition-colors rounded text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onShowDayDetail) {
                                onShowDayDetail(date, dayOrders, dayDeliveries);
                              }
                            }}
                            title={`Voir tous les éléments (${totalItems})`}
                          >
                            <Search className="w-3 h-3 mr-1 text-gray-600" />
                            <span className="text-gray-700 font-medium">+{totalItems - maxVisibleItems}</span>
                          </div>
                        </>
                      );
                    }
                    
                    // Si peu d'éléments, afficher normalement
                    return (
                      <>
                        {dayOrders.map((order) => {
                          const colorClass = order.status === 'delivered' 
                            ? 'bg-delivered text-white' 
                            : order.status === 'planned'
                            ? 'bg-orange-500 text-white border-2 border-orange-300'
                            : 'bg-primary text-white';
                          
                          return (
                            <div
                              key={`order-${order.id}`}
                              className={`text-xs px-2 py-1 flex items-center justify-between cursor-pointer ${colorClass}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onItemClick(order, 'order');
                              }}
                            >
                              <span className="truncate">
                                {order.supplier.name}
                              </span>
                              <div className="flex items-center ml-1 flex-shrink-0">
                                {order.status === 'planned' && (
                                  <span className="w-2 h-2 bg-yellow-300 mr-1" title="Commande planifiée (liée à une livraison)" />
                                )}
                                {order.status === 'delivered' && (
                                  <Check className="w-3 h-3" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                        
                        {dayDeliveries.map((delivery) => (
                          <div
                            key={`delivery-${delivery.id}`}
                            className={`text-xs px-2 py-1 flex items-center justify-between cursor-pointer ${
                              delivery.status === 'delivered' 
                                ? 'bg-delivered text-white' 
                                : delivery.status === 'pending'
                                ? 'bg-yellow-500 text-white border-2 border-yellow-300'
                                : 'bg-secondary text-white'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onItemClick(delivery, 'delivery');
                            }}
                          >
                            <span className="truncate">
                              {delivery.supplier.name} - {formatQuantity(delivery.quantity, delivery.unit)}
                            </span>
                            <div className="flex items-center ml-1 flex-shrink-0">
                              {delivery.status === 'pending' && (
                                <span className="w-2 h-2 bg-orange-300 mr-1" title="En attente de validation" />
                              )}
                              {delivery.status === 'delivered' && (
                                <Check className="w-3 h-3" />
                              )}
                            </div>
                          </div>
                        ))}
                      </>
                    );
                  })()}
                </div>
              </div>
              
              {/* Quick Create Button */}
              {isCurrentMonth && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    className="w-6 h-6 bg-accent text-white rounded-full p-0 hover:bg-orange-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDateClick(date);
                    }}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
