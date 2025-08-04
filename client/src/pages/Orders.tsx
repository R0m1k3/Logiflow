import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Package, Search, Filter, 
  Building, Calendar, Edit, Trash2, Eye, UserIcon 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CreateOrderModal } from '@/components/modals/CreateOrderModal';
import { EditOrderModal } from '@/components/modals/EditOrderModal';
import { OrderDetailModal } from '@/components/modals/OrderDetailModal';
import { ConfirmDeleteModal } from '@/components/modals/ConfirmDeleteModal';
import { useAuthUnified } from '@/hooks/useAuthUnified';
import { usePermissions } from '@/hooks/usePermissions';
import { useStore } from '@/components/Layout';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/ui/pagination';
import { apiRequest } from '@/lib/queryClient';
import { safeFormat } from '@/lib/dateUtils';
import type { Order } from '@shared/schema';

export default function Orders() {
  const queryClient = useQueryClient();
  const { user } = useAuthUnified();
  const { hasPermission } = usePermissions();
  const { selectedStoreId } = useStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  // Build query URL with store filter
  const queryUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedStoreId && selectedStoreId !== 'all') {
      params.append('storeId', selectedStoreId);
    }
    return `/api/orders${params.toString() ? `?${params.toString()}` : ''}`;
  }, [selectedStoreId]);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['/api/orders', selectedStoreId],
    queryFn: () => apiRequest(queryUrl),
  });

  // Permissions
  const canCreate = hasPermission('orders_create');
  const canEdit = hasPermission('orders_update');
  const canDelete = hasPermission('orders_delete');

  // Filter orders
  const filteredOrders = useMemo(() => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.group?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.comments?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    return filtered;
  }, [orders, searchTerm, statusFilter]);

  const {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    paginatedData: paginatedOrders,
    totalItems
  } = usePagination(filteredOrders, 10);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (orderId: number) => apiRequest(`/api/orders/${orderId}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      setShowDeleteModal(false);
      setOrderToDelete(null);
    }
  });

  const confirmDeleteOrder = () => {
    if (orderToDelete) {
      deleteMutation.mutate(orderToDelete.id);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'En attente' },
      planned: { color: 'bg-blue-100 text-blue-800', text: 'Planifié' },
      delivered: { color: 'bg-green-100 text-green-800', text: 'Livré' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Badge className={`${config.color} border-0`}>
        {config.text}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 shadow-sm -m-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-7 h-7 text-blue-600" />
              Commandes
            </h2>
            <p className="text-gray-600 mt-1">
              {filteredOrders.length} commande{filteredOrders.length !== 1 ? 's' : ''}
            </p>
          </div>
          {canCreate && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Commande
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg flex-shrink-0">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher par fournisseur, groupe ou commentaire..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border border-gray-300 shadow-sm"
              />
            </div>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 border border-gray-300 shadow-sm">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="planned">Planifié</SelectItem>
              <SelectItem value="delivered">Livré</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Package className="w-16 h-16 mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">Aucune commande trouvée</h3>
            <p className="text-center max-w-md">
              {searchTerm || statusFilter !== "all"
                ? "Aucune commande ne correspond à vos critères de recherche."
                : "Vous n'avez pas encore de commandes. Créez votre première commande pour commencer."}
            </p>
            {canCreate && !searchTerm && statusFilter === "all" && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer une commande
              </Button>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 h-full flex flex-col">
              {/* Pagination du haut */}
              <div className="mb-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                  className="border-b border-gray-200 pb-4"
                />
              </div>
              
              <div className="bg-white border border-gray-200 shadow-lg overflow-hidden flex-1">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fournisseur
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Groupe
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date prévue
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Créé par
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedOrders.map((order) => (
                        <tr 
                          key={order.id} 
                          className={`hover:bg-gray-50 ${
                            order.status === 'delivered' 
                              ? 'opacity-60 bg-gray-50' 
                              : ''
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Building className="w-5 h-5 text-gray-400 mr-2" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {order.supplier?.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  #{order.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div 
                                className="w-3 h-3 rounded-full mr-2" 
                                style={{ backgroundColor: order.group?.color }}
                              />
                              <span className="text-sm text-gray-900">{order.group?.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                              {safeFormat(order.plannedDate, 'dd MMMM yyyy')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(order.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <UserIcon className="w-4 h-4 text-gray-400 mr-2" />
                              {order.creator?.username || order.creator?.name || order.createdBy}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowDetailModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {canEdit && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setShowEditModal(true);
                                  }}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              )}
                              {canDelete && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setOrderToDelete(order);
                                    setShowDeleteModal(true);
                                  }}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination du bas */}
                <div className="p-4 border-t border-gray-200">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateOrderModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          selectedDate={null}
        />
      )}

      {showEditModal && selectedOrder && (
        <EditOrderModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          order={selectedOrder}
        />
      )}

      {showDetailModal && selectedOrder && (
        <OrderDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          item={selectedOrder}
        />
      )}

      {/* Modal de confirmation de suppression */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setOrderToDelete(null);
        }}
        onConfirm={confirmDeleteOrder}
        title="Supprimer la commande"
        description="Êtes-vous sûr de vouloir supprimer cette commande ?"
        itemName={orderToDelete ? `${orderToDelete.supplier?.name} - ${safeFormat(orderToDelete.plannedDate, 'dd MMMM yyyy')}` : undefined}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}