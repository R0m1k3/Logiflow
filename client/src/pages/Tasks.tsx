import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthUnified } from "@/hooks/useAuthUnified";
import { usePermissions } from "@/hooks/usePermissions";
import { useStore } from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pagination, usePagination } from "@/components/ui/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  ListTodo, 
  Plus, 
  Search, 
  Circle,
  Clock,
  AlertTriangle,
  CheckCircle,
  Edit,
  Trash2,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import TaskForm from "@/components/tasks/TaskForm";
import { Task } from "@shared/schema";

type TaskWithRelations = Task & {
  assignedUser: { id: string; username: string; firstName?: string; lastName?: string; };
  creator: { id: string; username: string; firstName?: string; lastName?: string; };
  group: { id: number; name: string; color: string; };
};

export default function Tasks() {
  const { user } = useAuthUnified();
  const { hasPermission } = usePermissions();
  const { selectedStoreId } = useStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // États locaux
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<TaskWithRelations | null>(null);

  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["/api/tasks", selectedStoreId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedStoreId) {
        params.append('storeId', selectedStoreId.toString());
      }
      return fetch(`/api/tasks?${params.toString()}`, {
        credentials: 'include'
      }).then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      }).then(data => {
        console.log('📋 Tasks received from API:', data.map((task: any) => ({
          id: task.id,
          title: task.title,
          startDate: task.startDate,
          status: task.status
        })));
        return data;
      });
    },
    enabled: !!user,
  });

  // Fetch users for task assignment
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: () => fetch('/api/users', {
      credentials: 'include'
    }).then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    }),
    enabled: !!user,
  });



  const handleEditTask = (task: TaskWithRelations) => {
    setSelectedTask(task);
    setShowEditModal(true);
  };

  const handleCompleteTask = async (taskId: number) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la completion de la tâche');
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Succès",
        description: "Tâche marquée comme terminée",
      });
    } catch (error) {
      console.error("Error completing task:", error);
      toast({
        title: "Erreur",
        description: "Impossible de terminer la tâche",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (task: TaskWithRelations) => {
    setTaskToDelete(task);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;

    try {
      const response = await fetch(`/api/tasks/${taskToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Succès",
        description: "Tâche supprimée avec succès",
      });
      
      setShowDeleteModal(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la tâche",
        variant: "destructive",
      });
    }
  };

  // Fonction pour vérifier si une tâche doit être visible selon les règles de date de début
  const isTaskVisible = (task: TaskWithRelations) => {
    // Admins et directeurs voient toutes les tâches
    if (user?.role === 'admin' || user?.role === 'directeur') {
      return true;
    }

    // Si pas de date de début, la tâche est visible
    if (!task.startDate) {
      return true;
    }

    // La tâche n'est visible qu'après sa date de début
    const now = new Date();
    const startDate = new Date(task.startDate);
    return startDate <= now;
  };

  // Fonction pour vérifier si une tâche est "à venir"
  const isTaskUpcoming = (task: TaskWithRelations) => {
    if (!task.startDate) {
      console.log(`🔍 Task "${task.title}" - PAS de startDate, retourne false`);
      return false;
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0); // Normaliser à minuit pour une comparaison jour par jour
    
    const startDate = new Date(task.startDate);
    startDate.setHours(0, 0, 0, 0); // Normaliser à minuit
    
    const isUpcoming = startDate > now;
    
    console.log(`🔍 Task "${task.title}" upcoming check:`, {
      taskId: task.id,
      startDate: task.startDate,
      normalizedStartDate: startDate.toISOString(),
      normalizedNow: now.toISOString(),
      isUpcoming
    });
    
    return isUpcoming;
  };

  // Filtrer les tâches
  const filteredTasks = tasks.filter((task: TaskWithRelations) => {
    // Filtre par visibilité selon date de début
    if (!isTaskVisible(task)) {
      return false;
    }

    // Filtre par recherche
    if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !task.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Filtre par statut
    if (statusFilter !== "all" && task.status !== statusFilter) {
      return false;
    }

    // Filtre par priorité
    if (priorityFilter !== "all" && task.priority !== priorityFilter) {
      return false;
    }

    return true;
  });

  // Pagination
  const {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    paginatedData: paginatedTasks,
    totalItems
  } = usePagination(filteredTasks, 10);

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high':
        return { 
          color: 'destructive' as const, 
          icon: AlertTriangle, 
          label: 'Élevée' 
        };
      case 'medium':
        return { 
          color: 'default' as const, 
          icon: Clock, 
          label: 'Moyenne' 
        };
      case 'low':
        return { 
          color: 'secondary' as const, 
          icon: Circle, 
          label: 'Faible' 
        };
      default:
        return { 
          color: 'secondary' as const, 
          icon: Circle, 
          label: 'Moyenne' 
        };
    }
  };

  // 🔧 FIX TOUS RÔLES - Bypass hasPermission défaillant selon spécifications
  const isAdmin = user && (user as any).role === 'admin';
  const isManager = user && (user as any).role === 'manager';
  const isEmployee = user && (user as any).role === 'employee';
  const isDirecteur = user && (user as any).role === 'directeur';
  
  // Spécifications: Employé peut lire/créer/modifier, Manager et Directeur peuvent tout (Y COMPRIS VALIDATION)
  const canCreateTasks = isAdmin || isManager || isDirecteur || hasPermission('tasks_create');
  const canEditTasks = isAdmin || isManager || isDirecteur || hasPermission('tasks_update');
  const canDeleteTasks = isAdmin || isManager || isDirecteur || hasPermission('tasks_delete');
  const canValidateTasks = isAdmin || isManager || isDirecteur || hasPermission('tasks_validate');

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 shadow-sm -m-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
              <ListTodo className="w-6 h-6 mr-3 text-blue-600" />
              Gestion des Tâches
            </h2>
            <p className="text-gray-600 mt-1">
              {totalItems} tâche{totalItems !== 1 ? 's' : ''} trouvée{totalItems !== 1 ? 's' : ''}
            </p>
          </div>
          {canCreateTasks && (
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle Tâche
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Créer une nouvelle tâche</DialogTitle>
                </DialogHeader>
                <TaskForm
                  onClose={() => setShowCreateModal(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar avec filtres */}
        <div className="w-80 bg-gray-50 border-r border-gray-200 p-4 flex-shrink-0">
          {/* Filtres */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Filtres</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filtre par statut */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Statut
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="pending">En cours</SelectItem>
                    <SelectItem value="completed">Terminées</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtre par priorité */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Priorité
                </label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="high">Élevée</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="low">Faible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Zone principale avec les tâches */}
        <div className="flex-1">
          {/* Liste des tâches */}
          <div className="p-6">
            {/* Pagination du haut */}
            {totalItems > 0 && (
              <div className="mb-6">
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
            )}
            
            {totalItems === 0 ? (
              <div className="text-center py-12">
                <ListTodo className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucune tâche
                </h3>
                <p className="text-gray-600">
                  Aucune tâche trouvée avec les filtres sélectionnés.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto">
                {/* Tâches en cours */}
                {paginatedTasks.filter(task => task.status === 'pending').length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      Tâches en cours ({paginatedTasks.filter(task => task.status === 'pending').length})
                    </h4>
                    <div className="space-y-3">
                      {paginatedTasks
                        .filter(task => task.status === 'pending')
                        .map((task) => {
                          const priorityConfig = getPriorityConfig(task.priority);
                          const PriorityIcon = priorityConfig.icon;
                          
                          const isUpcoming = isTaskUpcoming(task);
                          
                          return (
                            <Card key={task.id} className={`hover:shadow-md transition-shadow ${isUpcoming ? 'opacity-60 bg-gray-50' : ''}`}>
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h5 className={`font-medium truncate ${isUpcoming ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                        {task.title}
                                      </h5>
                                      <Badge variant={priorityConfig.color} className="flex items-center gap-1">
                                        <PriorityIcon className="w-3 h-3" />
                                        {priorityConfig.label}
                                      </Badge>
                                      {isUpcoming && (
                                        <Badge variant="outline" className="flex items-center gap-1 text-blue-600 border-blue-200">
                                          <Calendar className="w-3 h-3" />
                                          À venir
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    {task.description && (
                                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                        {task.description}
                                      </p>
                                    )}
                                    
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                      <span>
                                        Assigné à: {task.assignedTo}
                                      </span>
                                      <span>
                                        Créée: {format(new Date(task.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                                      </span>
                                      {task.startDate && (
                                        <span className="text-blue-600 font-medium">
                                          <Calendar className="w-3 h-3 inline mr-1" />
                                          Début: {format(new Date(task.startDate), 'dd/MM/yyyy', { locale: fr })}
                                        </span>
                                      )}
                                      {task.dueDate && (
                                        <span className="text-orange-600 font-medium">
                                          <Clock className="w-3 h-3 inline mr-1" />
                                          Échéance: {format(new Date(task.dueDate), 'dd/MM/yyyy', { locale: fr })}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 ml-4">
                                    {canValidateTasks && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleCompleteTask(task.id)}
                                        className="text-green-600 hover:text-green-700"
                                      >
                                        <CheckCircle className="w-4 h-4" />
                                      </Button>
                                    )}
                                    {canEditTasks && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleEditTask(task)}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                    )}
                                    {canDeleteTasks && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDeleteClick(task)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Tâches terminées */}
                {paginatedTasks.filter(task => task.status === 'completed').length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 mt-8">
                      Tâches terminées ({paginatedTasks.filter(task => task.status === 'completed').length})
                    </h4>
                    <div className="space-y-3">
                      {paginatedTasks
                        .filter(task => task.status === 'completed')
                        .map((task) => {
                          const priorityConfig = getPriorityConfig(task.priority);
                          const PriorityIcon = priorityConfig.icon;
                          
                          return (
                            <Card key={task.id} className="opacity-60 bg-gray-50">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h5 className="font-medium text-gray-500 truncate line-through">
                                        {task.title}
                                      </h5>
                                      <Badge variant="secondary" className="flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        Terminée
                                      </Badge>
                                    </div>
                                    
                                    {task.description && (
                                      <p className="text-sm text-gray-400 mb-2 line-clamp-2 line-through">
                                        {task.description}
                                      </p>
                                    )}
                                    
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                      <span>
                                        Assigné à: {task.assignedTo}
                                      </span>
                                      <span>
                                        Créée: {format(new Date(task.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                                      </span>
                                      {task.dueDate && (
                                        <span className="text-gray-400">
                                          <Clock className="w-3 h-3 inline mr-1" />
                                          Échéance: {format(new Date(task.dueDate), 'dd/MM/yyyy', { locale: fr })}
                                        </span>
                                      )}
                                      {task.completedAt && (
                                        <span>
                                          Terminée: {format(new Date(task.completedAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 ml-4">
                                    {canDeleteTasks && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDeleteClick(task)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Pagination du bas */}
            {totalItems > 0 && (
              <div className="mt-6 border-t border-gray-200 pt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal d'édition */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la tâche</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <TaskForm
              task={selectedTask}
              onClose={() => {
                setShowEditModal(false);
                setSelectedTask(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de confirmation de suppression */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Confirmer la suppression
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">
              Êtes-vous sûr de vouloir supprimer la tâche "{taskToDelete?.title}" ?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Cette action est irréversible.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setTaskToDelete(null);
              }}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}