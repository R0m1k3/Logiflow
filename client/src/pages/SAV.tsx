import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuthUnified } from "@/hooks/useAuthUnified";
import { useStore } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Eye, Edit, Trash2, User, Package, Calendar, AlertTriangle, Phone } from "lucide-react";
import { ConfirmDeleteModal } from "@/components/modals/ConfirmDeleteModal";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { SavTicketWithRelations, Supplier, InsertSavTicket } from "@shared/schema";

const ticketFormSchema = z.object({
  supplierId: z.number().min(1, "Veuillez sélectionner un fournisseur"),
  clientName: z.string().optional().nullable(),
  clientPhone: z.string().optional().nullable(),
  productGencode: z.string().min(1, "Le code-barres est obligatoire"),
  productReference: z.string().optional().nullable(),
  productDesignation: z.string().min(1, "La désignation est obligatoire"),
  problemType: z.string().min(1, "Veuillez sélectionner un type de problème"),
  problemDescription: z.string().min(1, "La description du problème est obligatoire"),
  resolutionDescription: z.string().optional().nullable(),
  status: z.string().default("nouveau"),
});

type TicketFormData = z.infer<typeof ticketFormSchema>;

const PROBLEM_TYPES = [
  { value: "defaut_produit", label: "Défaut produit" },
  { value: "erreur_livraison", label: "Erreur livraison" },
  { value: "produit_manquant", label: "Produit manquant" },
  { value: "quantite_incorrecte", label: "Quantité incorrecte" },
  { value: "emballage_endommage", label: "Emballage endommagé" },
  { value: "autre", label: "Autre" },
];

const STATUS_COLORS = {
  nouveau: "bg-blue-100 text-blue-800",
  en_cours: "bg-yellow-100 text-yellow-800", 
  resolu: "bg-green-100 text-green-800",
  ferme: "bg-gray-100 text-gray-800",
};

const STATUS_LABELS = {
  nouveau: "Nouveau",
  en_cours: "En cours",
  resolu: "Résolu", 
  ferme: "Fermé",
};

function checkSavPermission(userRole: string, action: 'read' | 'create' | 'update' | 'delete'): boolean {
  switch (userRole) {
    case 'admin':
      return true; // Admin peut tout faire
    case 'directeur':
      return true; // Directeur peut tout faire (y compris supprimer)
    case 'manager':
      return action !== 'delete'; // Manager peut tout sauf supprimer
    case 'employee':
      return action === 'read'; // Utilisateur simple : lecture seule
    default:
      return false;
  }
}

export default function SAV() {
  const { user } = useAuthUnified();
  const { selectedStoreId } = useStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SavTicketWithRelations | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const userRole = (user as any)?.role || 'employee';
  const canCreate = checkSavPermission(userRole, 'create');
  const canUpdate = checkSavPermission(userRole, 'update');
  const canDelete = checkSavPermission(userRole, 'delete');

  // Build query URL with store filter like Orders module
  const queryUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedStoreId && selectedStoreId !== 'all' && (user as any)?.role === 'admin') {
      params.append('storeId', selectedStoreId.toString());
    }
    return `/api/sav-tickets${params.toString() ? `?${params.toString()}` : ''}`;
  }, [selectedStoreId, (user as any)?.role]);

  // Récupération des données
  const { data: savTickets = [], isLoading: ticketsLoading } = useQuery<SavTicketWithRelations[]>({
    queryKey: ['/api/sav-tickets', selectedStoreId],
    queryFn: () => apiRequest(queryUrl),
    enabled: !!user,
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ['/api/suppliers'],
    queryFn: () => apiRequest('/api/suppliers'),
    enabled: !!user,
  });

  // Formulaire de création/édition
  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      supplierId: 0,
      clientName: "",
      clientPhone: "",
      productGencode: "",
      productReference: "",
      productDesignation: "",
      problemType: "",
      problemDescription: "",
      resolutionDescription: "",
      status: "nouveau",
    },
  });

  // Mutations
  const createTicketMutation = useMutation({
    mutationFn: (data: InsertSavTicket) =>
      apiRequest('/api/sav-tickets', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sav-tickets'] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: (data: { id: number; updates: Partial<InsertSavTicket> }) =>
      apiRequest(`/api/sav-tickets/${data.id}`, 'PATCH', data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sav-tickets'] });
      setIsEditDialogOpen(false);
      setSelectedTicket(null);
      form.reset();
    },
  });

  const deleteTicketMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/sav-tickets/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sav-tickets'] });
    },
  });

  // Filtrage des tickets
  const filteredTickets = savTickets.filter(ticket => {
    const matchesSearch = 
      ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.productDesignation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.productGencode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.supplier.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesSupplier = supplierFilter === "all" || ticket.supplierId.toString() === supplierFilter;
    
    return matchesSearch && matchesStatus && matchesSupplier;
  });

  // Statistiques
  const stats = {
    total: savTickets.length,
    nouveau: savTickets.filter(t => t.status === 'nouveau').length,
    en_cours: savTickets.filter(t => t.status === 'en_cours').length,
    resolu: savTickets.filter(t => t.status === 'resolu').length,
    ferme: savTickets.filter(t => t.status === 'ferme').length,
  };

  const onSubmit = (data: TicketFormData) => {
    const ticketData: InsertSavTicket = {
      ...data,
      groupId: selectedStoreId!,
      createdBy: (user as any)?.id || 'unknown',
    };

    if (selectedTicket) {
      updateTicketMutation.mutate({
        id: selectedTicket.id,
        updates: ticketData,
      });
    } else {
      createTicketMutation.mutate(ticketData);
    }
  };

  const handleEdit = (ticket: SavTicketWithRelations) => {
    setSelectedTicket(ticket);
    form.reset({
      supplierId: ticket.supplierId,
      clientName: ticket.clientName || "",
      clientPhone: ticket.clientPhone || "",
      productGencode: ticket.productGencode,
      productReference: ticket.productReference || "",
      productDesignation: ticket.productDesignation,
      problemType: ticket.problemType,
      problemDescription: ticket.problemDescription,
      resolutionDescription: ticket.resolutionDescription || "",
      status: ticket.status,
    });
    setIsEditDialogOpen(true);
  };

  // États pour les modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<SavTicketWithRelations | null>(null);

  const handleDelete = (ticket: SavTicketWithRelations) => {
    setTicketToDelete(ticket);
    setShowDeleteModal(true);
  };

  const confirmDeleteTicket = () => {
    if (ticketToDelete) {
      deleteTicketMutation.mutate(ticketToDelete.id);
      setShowDeleteModal(false);
      setTicketToDelete(null);
    }
  };

  const handleDetail = (ticket: SavTicketWithRelations) => {
    setSelectedTicket(ticket);
    setIsDetailDialogOpen(true);
  };

  if (ticketsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des tickets SAV...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête avec titre et bouton d'action */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Après-Vente</h1>
          <p className="text-gray-600 mt-1">Gestion des tickets SAV et suivi des résolutions</p>
        </div>
        {canCreate && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-fit">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Créer un nouveau ticket SAV</DialogTitle>
              </DialogHeader>
              <TicketForm
                form={form}
                suppliers={suppliers}
                onSubmit={onSubmit}
                isLoading={createTicketMutation.isPending}
                isEdit={false}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Statistiques dans une seule carte */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Statistiques SAV</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50">
              <div className="p-2 bg-blue-100 rounded-full">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Total</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50">
              <div className="p-2 bg-blue-100 rounded-full">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Nouveau</p>
                <p className="text-2xl font-bold text-blue-600">{stats.nouveau}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-yellow-50">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Calendar className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">En cours</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.en_cours}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50">
              <div className="p-2 bg-green-100 rounded-full">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Résolu</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolu}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
              <div className="p-2 bg-gray-100 rounded-full">
                <Package className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Fermé</p>
                <p className="text-2xl font-bold text-gray-600">{stats.ferme}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Search className="h-4 w-4" />
            Recherche et filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher un ticket..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="nouveau">Nouveau</SelectItem>
                <SelectItem value="en_cours">En cours</SelectItem>
                <SelectItem value="resolu">Résolu</SelectItem>
                <SelectItem value="ferme">Fermé</SelectItem>
              </SelectContent>
            </Select>
            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les fournisseurs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les fournisseurs</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id.toString()}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des tickets */}
      <div className="bg-white rounded-lg border">
        {ticketsLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des tickets SAV...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun ticket SAV</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' || supplierFilter !== 'all'
                ? "Aucun ticket ne correspond aux critères de recherche"
                : "Commencez par créer votre premier ticket SAV"}
            </p>
            {canCreate && !searchTerm && statusFilter === 'all' && supplierFilter === 'all' && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer le premier ticket
              </Button>
            )}
          </div>
        ) : (
          <div>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Tickets SAV ({filteredTickets.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      N° Ticket
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fournisseur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client & Produit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Problème
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Créé par
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date création
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm font-medium text-gray-900">
                          {ticket.ticketNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ticket.supplier.name}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          {ticket.clientName && (
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              <User className="h-3 w-3 inline mr-1" />
                              {ticket.clientName}
                              {ticket.clientPhone && (
                                <span className="text-gray-500 ml-2">
                                  <Phone className="h-3 w-3 inline mr-1" />
                                  {ticket.clientPhone}
                                </span>
                              )}
                            </div>
                          )}
                          <div className="text-sm font-medium text-gray-900">{ticket.productDesignation}</div>
                          <div className="text-sm text-gray-500">
                            {ticket.productGencode}
                            {ticket.productReference && ` • ${ticket.productReference}`}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {PROBLEM_TYPES.find(pt => pt.value === ticket.problemType)?.label || ticket.problemType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={STATUS_COLORS[ticket.status as keyof typeof STATUS_COLORS]}>
                          {STATUS_LABELS[ticket.status as keyof typeof STATUS_LABELS]}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {ticket.creator.username || ticket.creator.name || ticket.createdBy}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ticket.createdAt ? format(new Date(ticket.createdAt), "dd MMMM yyyy à HH:mm", { locale: fr }) : 'Date inconnue'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDetail(ticket)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {canUpdate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(ticket)}
                              className="text-gray-600 hover:text-gray-700"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(ticket)}
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
          </div>
        )}
      </div>

      {/* Dialog de détail */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Détail du ticket SAV</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <TicketDetail ticket={selectedTicket} onClose={() => setIsDetailDialogOpen(false)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog d'édition */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le ticket SAV</DialogTitle>
          </DialogHeader>
          <TicketForm
            form={form}
            suppliers={suppliers}
            onSubmit={onSubmit}
            isLoading={updateTicketMutation.isPending}
            isEdit={true}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de confirmation de suppression */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setTicketToDelete(null);
        }}
        onConfirm={confirmDeleteTicket}
        title="Supprimer le ticket SAV"
        description="Êtes-vous sûr de vouloir supprimer ce ticket SAV ?"
        itemName={ticketToDelete ? `${ticketToDelete.ticketNumber} - ${ticketToDelete.productDesignation}` : undefined}
        isLoading={deleteTicketMutation.isPending}
      />
    </div>
  );
}

// Composant de formulaire
function TicketForm({
  form,
  suppliers,
  onSubmit,
  isLoading,
  isEdit,
}: {
  form: any;
  suppliers: Supplier[];
  onSubmit: (data: TicketFormData) => void;
  isLoading: boolean;
  isEdit: boolean;
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="supplierId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fournisseur *</FormLabel>
                <Select
                  value={field.value?.toString()}
                  onValueChange={(value) => field.onChange(parseInt(value))}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un fournisseur" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="clientName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom du client</FormLabel>
                <FormControl>
                  <Input placeholder="Nom du client (optionnel)" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="clientPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Téléphone du client</FormLabel>
                <FormControl>
                  <Input placeholder="Numéro de téléphone (optionnel)" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="problemType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type de problème *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Type de problème" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PROBLEM_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="productGencode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code-barres *</FormLabel>
                <FormControl>
                  <Input placeholder="Code-barres du produit" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="productReference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Référence produit</FormLabel>
                <FormControl>
                  <Input placeholder="Référence (optionnel)" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="productDesignation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Désignation du produit *</FormLabel>
              <FormControl>
                <Input placeholder="Nom du produit" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="problemDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description du problème *</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Décrivez le problème en détail"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isEdit && (
          <>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Statut</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="nouveau">Nouveau</SelectItem>
                      <SelectItem value="en_cours">En cours</SelectItem>
                      <SelectItem value="resolu">Résolu</SelectItem>
                      <SelectItem value="ferme">Fermé</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="resolutionDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description de la résolution</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Décrivez la résolution apportée"
                      className="min-h-[80px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Enregistrement..." : isEdit ? "Modifier" : "Créer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Composant de détail du ticket
function TicketDetail({ 
  ticket, 
  onClose 
}: { 
  ticket: SavTicketWithRelations;
  onClose: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-gray-500">N° Ticket</Label>
          <p className="font-mono font-medium">{ticket.ticketNumber}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-500">Statut</Label>
          <Badge className={`mt-1 ${STATUS_COLORS[ticket.status as keyof typeof STATUS_COLORS]}`}>
            {STATUS_LABELS[ticket.status as keyof typeof STATUS_LABELS]}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-gray-500">Fournisseur</Label>
          <p>{ticket.supplier.name}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-500">Type de problème</Label>
          <p>{PROBLEM_TYPES.find(pt => pt.value === ticket.problemType)?.label || ticket.problemType}</p>
        </div>
      </div>

      {/* Informations client */}
      {(ticket.clientName || ticket.clientPhone) && (
        <div>
          <Label className="text-sm font-medium text-gray-500">Informations client</Label>
          <div className="mt-1 space-y-1">
            {ticket.clientName && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span>{ticket.clientName}</span>
              </div>
            )}
            {ticket.clientPhone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{ticket.clientPhone}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <Label className="text-sm font-medium text-gray-500">Produit</Label>
        <div className="mt-1">
          <p className="font-medium">{ticket.productDesignation}</p>
          <p className="text-sm text-gray-500">
            Code-barres: {ticket.productGencode}
            {ticket.productReference && ` • Référence: ${ticket.productReference}`}
          </p>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-500">Description du problème</Label>
        <p className="mt-1 whitespace-pre-wrap">{ticket.problemDescription}</p>
      </div>

      {ticket.resolutionDescription && (
        <div>
          <Label className="text-sm font-medium text-gray-500">Résolution</Label>
          <p className="mt-1 whitespace-pre-wrap">{ticket.resolutionDescription}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-gray-500">Créé par</Label>
          <div className="flex items-center gap-2 mt-1">
            <User className="h-4 w-4 text-gray-400" />
            <span>{ticket.creator.username || ticket.creator.name || ticket.createdBy}</span>
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-500">Date de création</Label>
          <p className="flex items-center gap-2 mt-1">
            <Calendar className="h-4 w-4 text-gray-400" />
            {ticket.createdAt ? format(new Date(ticket.createdAt), "dd MMMM yyyy à HH:mm", { locale: fr }) : 'Date inconnue'}
          </p>
        </div>
      </div>

      {(ticket.resolvedAt || ticket.closedAt) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ticket.resolvedAt && (
            <div>
              <Label className="text-sm font-medium text-gray-500">Date de résolution</Label>
              <p className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-gray-400" />
                {format(new Date(ticket.resolvedAt), "dd MMMM yyyy à HH:mm", { locale: fr })}
              </p>
            </div>
          )}
          {ticket.closedAt && (
            <div>
              <Label className="text-sm font-medium text-gray-500">Date de fermeture</Label>
              <p className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-gray-400" />
                {format(new Date(ticket.closedAt), "dd MMMM yyyy à HH:mm", { locale: fr })}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>
          Fermer
        </Button>
      </div>
    </div>
  );
}