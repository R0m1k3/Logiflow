import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthUnified } from "@/hooks/useAuthUnified";
import { useStore } from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  ListTodo, 
  Plus, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Circle,
  Clock,
  AlertTriangle,
  CheckCircle,
  Edit,
  Trash2
} from "lucide-react";
import { format, addDays, subDays, startOfDay, endOfDay, isSameDay } from "date-fns";
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
  const { selectedStoreId } = useStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // États locaux
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);

  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["/api/tasks", selectedStoreId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedStoreId) {
        params.append('storeId', selectedStoreId);
      }
      return fetch(`/api/tasks?${params.toString()}`, {
        credentials: 'include'
      }).then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
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

  const handlePreviousDay = () => {
    setSelectedDate(prev => subDays(prev, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

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

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
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
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la tâche",
        variant: "destructive",
      });
    }
  };

  // Filtrer les tâches
  const filteredTasks = tasks.filter((task: TaskWithRelations) => {
    // Filtre par date sélectionnée
    const isSelectedDate = task.dueDate ? isSameDay(new Date(task.dueDate), selectedDate) : false;
    if (!isSelectedDate && task.status !== 'completed') {
      // Montrer aussi les tâches sans date d'échéance pour le jour courant
      if (!task.dueDate && isSameDay(selectedDate, new Date())) {
        // Ok, montrer les tâches sans date pour aujourd'hui
      } else {
        return false;
      }
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

  const canCreateTasks = user?.role === 'admin' || user?.role === 'manager';

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
              <ListTodo className="w-6 h-6 mr-3 text-blue-600" />
              Gestion des Tâches
            </h2>
            <p className="text-gray-600 mt-1">
              {filteredTasks.length} tâche{filteredTasks.length !== 1 ? 's' : ''} pour le {format(selectedDate, 'dd MMMM yyyy', { locale: fr })}
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
              <DialogContent className="max-w-2xl">
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

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar avec calendrier */}
        <div className="w-80 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2" />
                Calendrier
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={fr}
                className="rounded-md border w-full"
                classNames={{
                  months: "flex flex-col space-y-4 w-full",
                  month: "space-y-4 w-full",
                  table: "w-full border-collapse",
                  head_row: "flex w-full",
                  head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem] flex-1 text-center",
                  row: "flex w-full mt-2",
                  cell: "text-center text-sm p-0 relative flex-1 h-9 [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  day: "h-9 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md"
                }}
              />
            </CardContent>
          </Card>

          {/* Filtres */}
          <Card className="mt-4">
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
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Navigation de dates */}
          <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <Button variant="ghost" onClick={handlePreviousDay}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Jour précédent
            </Button>
            
            <h3 className="text-lg font-semibold">
              {format(selectedDate, 'EEEE dd MMMM yyyy', { locale: fr })}
            </h3>
            
            <Button variant="ghost" onClick={handleNextDay}>
              Jour suivant
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Liste des tâches */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <ListTodo className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucune tâche
                </h3>
                <p className="text-gray-600">
                  Aucune tâche trouvée pour cette date avec les filtres sélectionnés.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Tâches en cours */}
                {filteredTasks.filter(task => task.status === 'pending').length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      Tâches en cours ({filteredTasks.filter(task => task.status === 'pending').length})
                    </h4>
                    <div className="space-y-3">
                      {filteredTasks
                        .filter(task => task.status === 'pending')
                        .map((task) => {
                          const priorityConfig = getPriorityConfig(task.priority);
                          const PriorityIcon = priorityConfig.icon;
                          
                          return (
                            <Card key={task.id} className="hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h5 className="font-medium text-gray-900 truncate">
                                        {task.title}
                                      </h5>
                                      <Badge variant={priorityConfig.color} className="flex items-center gap-1">
                                        <PriorityIcon className="w-3 h-3" />
                                        {priorityConfig.label}
                                      </Badge>
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
                                      {task.dueDate && (
                                        <span>
                                          Échéance: {format(new Date(task.dueDate), 'dd/MM/yyyy HH:mm', { locale: fr })}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 ml-4">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleCompleteTask(task.id)}
                                      className="text-green-600 hover:text-green-700"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditTask(task)}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeleteTask(task.id)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
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
                {filteredTasks.filter(task => task.status === 'completed').length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 mt-8">
                      Tâches terminées ({filteredTasks.filter(task => task.status === 'completed').length})
                    </h4>
                    <div className="space-y-3">
                      {filteredTasks
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
                                      {task.completedAt && (
                                        <span>
                                          Terminée: {format(new Date(task.completedAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 ml-4">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeleteTask(task.id)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
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
          </div>
        </div>
      </div>

      {/* Modal d'édition */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
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
    </div>
  );
}