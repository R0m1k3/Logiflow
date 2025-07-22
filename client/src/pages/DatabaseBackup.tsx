import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Download, Upload, Database, Trash2, Calendar, FileText, AlertTriangle, CheckCircle, Timer, RefreshCw, Square, Play } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DatabaseBackup {
  id: string;
  filename: string;
  description: string;
  size: number;
  created_at: string;
  created_by: string;
  tables_count: number;
  status: 'creating' | 'completed' | 'failed';
}

// Composant pour gérer la sauvegarde automatique
function SchedulerCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer le statut du scheduler
  const { data: schedulerStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/scheduler/status'],
    queryFn: () => apiRequest('/api/scheduler/status'),
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  });

  // Mutation pour démarrer/arrêter le scheduler
  const toggleSchedulerMutation = useMutation({
    mutationFn: (action: 'start' | 'stop') => 
      apiRequest(`/api/scheduler/${action}`, { method: 'POST' }),
    onSuccess: (data, action) => {
      toast({
        title: "Succès",
        description: action === 'start' ? 
          "Sauvegarde automatique activée" : 
          "Sauvegarde automatique désactivée",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/scheduler/status'] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier la sauvegarde automatique",
        variant: "destructive",
      });
    },
  });

  // Mutation pour déclencher une sauvegarde immédiate
  const manualBackupMutation = useMutation({
    mutationFn: () => apiRequest('/api/scheduler/backup-now', { method: 'POST' }),
    onSuccess: (data) => {
      toast({
        title: "Sauvegarde créée",
        description: `Sauvegarde manuelle créée avec succès: ${data.backupId}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/database/backups'] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la sauvegarde manuelle",
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-5 w-5" />
          Sauvegarde automatique
        </CardTitle>
        <CardDescription>
          Configuration de la sauvegarde automatique quotidienne à minuit
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={schedulerStatus?.active ? "default" : "secondary"}>
                {schedulerStatus?.active ? "Actif" : "Inactif"}
              </Badge>
              {statusLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
            </div>
            {schedulerStatus?.nextRun && (
              <p className="text-sm text-muted-foreground">
                Prochaine sauvegarde : {schedulerStatus.nextRun}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => manualBackupMutation.mutate()}
              disabled={manualBackupMutation.isPending}
            >
              {manualBackupMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              Sauvegarder maintenant
            </Button>
            <Button
              variant={schedulerStatus?.active ? "destructive" : "default"}
              size="sm"
              onClick={() => toggleSchedulerMutation.mutate(schedulerStatus?.active ? 'stop' : 'start')}
              disabled={toggleSchedulerMutation.isPending}
            >
              {toggleSchedulerMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : schedulerStatus?.active ? (
                <Square className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {schedulerStatus?.active ? "Désactiver" : "Activer"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Composant pour gérer le rapprochement automatique par N° BL
function BLReconciliationCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer le statut du service de rapprochement BL
  const { data: blStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/bl-reconciliation/status'],
    queryFn: () => apiRequest('/api/bl-reconciliation/status'),
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  });

  // Mutation pour démarrer/arrêter le service
  const toggleBLServiceMutation = useMutation({
    mutationFn: (action: 'start' | 'stop') => 
      apiRequest(`/api/bl-reconciliation/${action}`, { method: 'POST' }),
    onSuccess: (data, action) => {
      toast({
        title: "Succès",
        description: action === 'start' ? 
          "Rapprochement automatique BL activé" : 
          "Rapprochement automatique BL désactivé",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bl-reconciliation/status'] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le service de rapprochement BL",
        variant: "destructive",
      });
    },
  });

  // Mutation pour déclencher un rapprochement manuel
  const manualReconciliationMutation = useMutation({
    mutationFn: () => apiRequest('/api/bl-reconciliation/trigger', { method: 'POST' }),
    onSuccess: (data) => {
      const result = data.result;
      toast({
        title: "Rapprochement terminé",
        description: `${result.reconciledDeliveries} livraisons rapprochées sur ${result.processedDeliveries} traitées`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bl-reconciliation/status'] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de déclencher le rapprochement manuel",
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Rapprochement automatique BL
        </CardTitle>
        <CardDescription>
          Rapprochement automatique des livraisons avec les factures par numéro de BL (toutes les 20 minutes)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={blStatus?.active ? "default" : "secondary"}>
                {blStatus?.active ? "Actif" : "Inactif"}
              </Badge>
              {statusLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
              {blStatus?.intervalMinutes && (
                <Badge variant="outline">
                  Toutes les {blStatus.intervalMinutes} min
                </Badge>
              )}
            </div>
            {blStatus?.nextRun && (
              <p className="text-sm text-muted-foreground">
                Prochain rapprochement : {blStatus.nextRun}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => manualReconciliationMutation.mutate()}
              disabled={manualReconciliationMutation.isPending}
            >
              {manualReconciliationMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              Rapprocher maintenant
            </Button>
            <Button
              variant={blStatus?.active ? "destructive" : "default"}
              size="sm"
              onClick={() => toggleBLServiceMutation.mutate(blStatus?.active ? 'stop' : 'start')}
              disabled={toggleBLServiceMutation.isPending}
            >
              {toggleBLServiceMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : blStatus?.active ? (
                <Square className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {blStatus?.active ? "Désactiver" : "Activer"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DatabaseBackup() {
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<DatabaseBackup | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer la liste des sauvegardes
  const { data: backups = [], isLoading, error } = useQuery<DatabaseBackup[]>({
    queryKey: ['/api/database/backups'],
    refetchInterval: 30000, // Actualiser toutes les 30 secondes
  });

  // Créer une sauvegarde
  const createBackupMutation = useMutation({
    mutationFn: async (description: string) => {
      const response = await fetch('/api/database/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la création de la sauvegarde');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sauvegarde lancée",
        description: "La création de la sauvegarde a été lancée en arrière-plan.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/database/backups'] });
      setDescription('');
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la sauvegarde",
        variant: "destructive",
      });
    },
  });

  // Télécharger une sauvegarde
  const downloadBackup = async (backup: DatabaseBackup) => {
    try {
      const response = await fetch(`/api/database/backup/${backup.id}/download`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = backup.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Téléchargement réussi",
        description: `Sauvegarde ${backup.filename} téléchargée`,
      });
    } catch (error) {
      toast({
        title: "Erreur de téléchargement",
        description: "Impossible de télécharger la sauvegarde",
        variant: "destructive",
      });
    }
  };

  // Supprimer une sauvegarde
  const deleteBackupMutation = useMutation({
    mutationFn: async (backupId: string) => {
      const response = await fetch(`/api/database/backup/${backupId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Erreur lors de la suppression';
        try {
          const error = JSON.parse(errorText);
          errorMessage = error.message || errorMessage;
        } catch {
          // Si ce n'est pas du JSON, utiliser le texte brut
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Vérifier s'il y a un contenu à parser
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      }
      
      // Pour les 204 No Content, retourner un objet vide
      return {};
    },
    onSuccess: () => {
      toast({
        title: "Sauvegarde supprimée",
        description: "La sauvegarde a été supprimée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/database/backups'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer la sauvegarde",
        variant: "destructive",
      });
    },
  });

  // Restaurer une sauvegarde
  const restoreBackupMutation = useMutation({
    mutationFn: async (backupId: string) => {
      const response = await fetch(`/api/database/backup/${backupId}/restore`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la restauration');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Restauration réussie",
        description: "La base de données a été restaurée avec succès",
      });
      setShowRestoreDialog(false);
      setRestoreTarget(null);
      queryClient.invalidateQueries({ queryKey: ['/api/database/backups'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de restauration",
        description: error.message || "Impossible de restaurer la sauvegarde",
        variant: "destructive",
      });
    },
  });

  // Upload et restauration d'un fichier
  const uploadRestoreMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('backup', file);
      
      const response = await fetch('/api/database/restore/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de l\'upload');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Restauration réussie",
        description: "La base de données a été restaurée depuis le fichier uploadé",
      });
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ['/api/database/backups'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de restauration",
        description: error.message || "Impossible de restaurer depuis le fichier",
        variant: "destructive",
      });
    },
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'creating':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-600">En cours</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-600">Terminée</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-600">Échouée</Badge>;
      default:
        return <Badge variant="outline">Inconnue</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="-m-6 mb-6 p-6 bg-white border-b">
        <div className="flex items-center gap-2 mb-2">
          <Database className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Sauvegarde Base de Données</h1>
        </div>
        <p className="text-gray-600">
          Gérez les sauvegardes complètes de votre base de données PostgreSQL
        </p>
      </div>

      {/* Création de sauvegarde */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Créer une nouvelle sauvegarde
          </CardTitle>
          <CardDescription>
            Créez une sauvegarde complète de la base de données PostgreSQL
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="description">Description de la sauvegarde</Label>
              <Textarea
                id="description"
                placeholder="Ex: Sauvegarde avant mise à jour majeure..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button 
              onClick={() => createBackupMutation.mutate(description)}
              disabled={createBackupMutation.isPending || !description.trim()}
              className="w-full"
            >
              {createBackupMutation.isPending ? 'Création en cours...' : 'Créer la sauvegarde'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Restauration depuis fichier */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Restaurer depuis un fichier
          </CardTitle>
          <CardDescription>
            Uploadez et restaurez une sauvegarde depuis un fichier SQL
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="backup-file">Fichier de sauvegarde (.sql)</Label>
              <Input
                id="backup-file"
                type="file"
                accept=".sql,.gz"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="mt-1"
              />
            </div>
            {selectedFile && (
              <div className="text-sm text-gray-600">
                Fichier sélectionné: {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </div>
            )}
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  disabled={!selectedFile || uploadRestoreMutation.isPending}
                  className="w-full"
                >
                  {uploadRestoreMutation.isPending ? 'Restauration en cours...' : 'Restaurer depuis le fichier'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Confirmer la restauration
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    <strong>ATTENTION:</strong> Cette action va remplacer complètement la base de données actuelle 
                    par le contenu du fichier uploadé. Toutes les données actuelles seront perdues.
                    <br /><br />
                    Êtes-vous sûr de vouloir continuer ?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => selectedFile && uploadRestoreMutation.mutate(selectedFile)}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Oui, restaurer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Services automatiques */}
      <SchedulerCard />
      <BLReconciliationCard />

      {/* Liste des sauvegardes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Sauvegardes disponibles ({backups.length}/10)
          </CardTitle>
          <CardDescription>
            Liste des sauvegardes créées (maximum 5 automatiques + 10 manuelles, nettoyage automatique)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Chargement des sauvegardes...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600">Erreur lors du chargement des sauvegardes</p>
            </div>
          )}

          {!isLoading && !error && backups.length === 0 && (
            <div className="text-center py-8">
              <Database className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Aucune sauvegarde disponible</p>
            </div>
          )}

          {!isLoading && !error && backups.length > 0 && (
            <div className="space-y-3">
              {backups.map((backup: DatabaseBackup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium truncate">{backup.filename}</h3>
                      {getStatusBadge(backup.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{backup.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(backup.created_at)}
                      </span>
                      <span>{formatFileSize(backup.size)}</span>
                      <span>{backup.tables_count} tables</span>
                      <span>par {backup.created_by}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {backup.status === 'completed' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadBackup(backup)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Télécharger
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Restaurer
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                Confirmer la restauration
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                <strong>ATTENTION:</strong> Cette action va remplacer complètement la base de données actuelle 
                                par la sauvegarde "{backup.filename}".
                                <br /><br />
                                Toutes les données actuelles seront perdues. Êtes-vous sûr de vouloir continuer ?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => restoreBackupMutation.mutate(backup.id)}
                                className="bg-red-500 hover:bg-red-600"
                                disabled={restoreBackupMutation.isPending}
                              >
                                {restoreBackupMutation.isPending ? 'Restauration...' : 'Oui, restaurer'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          disabled={deleteBackupMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer la sauvegarde</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer la sauvegarde "{backup.filename}" ?
                            Cette action est irréversible.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteBackupMutation.mutate(backup.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}