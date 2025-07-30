import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { safeFormat } from "@/lib/dateUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pagination, usePagination } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useStore } from "@/components/Layout";
import { useAuthUnified } from "@/hooks/useAuthUnified";

import { Search, Plus, Edit, FileText, Euro, Calendar, Building2, CheckCircle, X, RefreshCw, Loader2, AlertTriangle, Send, Upload, Trash2, RotateCcw, Wand2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format as formatDate } from "date-fns";
import { DayPicker } from "react-day-picker";
import { ConfirmDeleteModal } from "@/components/modals/ConfirmDeleteModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const reconciliationSchema = z.object({
  blNumber: z.string().optional(),
  blAmount: z.string().optional().refine((val) => !val || val === '' || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: "Le montant BL doit être un nombre positif ou vide",
  }),
  invoiceReference: z.string().optional(),
  invoiceAmount: z.string().optional().refine((val) => !val || val === '' || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: "Le montant facture doit être un nombre positif ou vide",
  }),
});

const webhookSchema = z.object({
  type: z.enum(["Facture", "Avoir"], {
    required_error: "Veuillez sélectionner un type",
  }),
  pdfFile: z.any().refine((file) => file && file.length > 0, "Veuillez sélectionner un fichier PDF"),
});

type ReconciliationForm = z.infer<typeof reconciliationSchema>;
type WebhookForm = z.infer<typeof webhookSchema>;

export default function BLReconciliation() {
  console.log('🔥 BL RECONCILIATION FIXED VERSION CHARGÉE - JAN 25 21:40');
  const { user } = useAuthUnified();
  const { selectedStoreId } = useStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // 🔧 FIX TOUS RÔLES - Seuls Admin et Directeur peuvent accéder au rapprochement
  const isAdmin = user && (user as any).role === 'admin';
  const isDirecteur = user && (user as any).role === 'directeur';
  const hasReconciliationAccess = isAdmin || isDirecteur;
  
  // Redirection pour les employés et managers (selon spécifications)
  if (!hasReconciliationAccess) {
    return (
      <div className="p-6">
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FileText className="h-5 w-5 text-orange-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-orange-700">
                <strong>Accès restreint</strong><br />
                Seuls les administrateurs et directeurs peuvent accéder au module de rapprochement BL/Factures.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const [searchTerm, setSearchTerm] = useState("");

  const [showReconciliationModal, setShowReconciliationModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deliveryToDelete, setDeliveryToDelete] = useState<any>(null);
  const [invoiceVerifications, setInvoiceVerifications] = useState<Record<string, { exists: boolean; error?: string; isUsed?: boolean; usedBy?: any }>>({});
  const [isVerifyingInvoices, setIsVerifyingInvoices] = useState(false);
  const [isVerifyingCurrentInvoice, setIsVerifyingCurrentInvoice] = useState(false);
  
  // États pour le modal webhook
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [selectedWebhookDelivery, setSelectedWebhookDelivery] = useState<any>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  

  
  // Form pour webhook
  const webhookForm = useForm<WebhookForm>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      type: "Facture",
      pdfFile: undefined,
    },
  });

  // Récupérer les fournisseurs pour le webhook
  const { data: suppliers = [] } = useQuery({
    queryKey: ['/api/suppliers'],
    select: (data) => Array.isArray(data) ? data : [],
  });

  // Récupérer les livraisons validées avec BL
  const { data: deliveriesWithBL = [], isLoading } = useQuery({
    queryKey: ['/api/deliveries/bl', selectedStoreId, selectedDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        // Remove withBL filter - show all delivered deliveries regardless of BL status
      });
      if (selectedStoreId && (user as any)?.role === 'admin') {
        params.append('storeId', selectedStoreId.toString());
      }
      
      // Ajouter filtre par date si sélectionné
      if (selectedDate) {
        const dateStr = formatDate(selectedDate, 'yyyy-MM-dd');
        params.append('startDate', dateStr);
        params.append('endDate', dateStr);
      }
      
      const response = await fetch(`/api/deliveries?${params.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch deliveries');
      }
      
      const deliveries = await response.json();
      console.log('🚚 BL Reconciliation - All deliveries received:', Array.isArray(deliveries) ? deliveries.length : 'NOT_ARRAY', deliveries);
      
      // Filtrer les livraisons pour rapprochement :
      // Toutes les livraisons qui ont été validées (livrées) pour permettre la saisie de données BL/facture
      const filtered = Array.isArray(deliveries) ? deliveries.filter((d: any) => {
        return d.status === 'delivered';
      }) : [];
      
      console.log('🚚 BL Reconciliation - Filtered deliveries:', filtered.length, filtered);
      
      // Livraisons pour rapprochement : livrées + dévalidées avec données BL
      
      // ✅ OPTIMISATION ANTI-SPAM : Vérifier seulement les factures avec données existantes depuis le cache
      // Pas de nouveaux appels NocoDB - seulement afficher les résultats déjà en cache
      if (filtered.length > 0) {
        const deliveriesWithInvoices = filtered.filter((delivery: any) => {
          return delivery.invoiceReference && delivery.invoiceReference.trim() !== '' && delivery.groupId;
        });
        
        if (Array.isArray(deliveriesWithInvoices) && deliveriesWithInvoices.length > 0) {
          console.log(`💾 BL Cache Check - ${deliveriesWithInvoices.length} factures à vérifier (depuis cache uniquement)`);
          console.log('🔍 DEBUG - Deliveries with invoices:', deliveriesWithInvoices.map(d => ({ id: d.id, invoiceRef: d.invoiceReference, groupId: d.groupId })));
          
          const invoiceReferencesToVerify = deliveriesWithInvoices.map((delivery: any) => ({
            groupId: delivery.groupId,
            invoiceReference: delivery.invoiceReference,
            deliveryId: delivery.id,
            supplierName: delivery.supplier?.name,
          }));
          
          console.log('🔍 DEBUG - Invoice references to verify:', invoiceReferencesToVerify);
          
          try {
            const verificationResponse = await fetch('/api/verify-invoices', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ invoiceReferences: invoiceReferencesToVerify }),
            });
            
            console.log('🔍 DEBUG - Verification response status:', verificationResponse.status);
            
            if (verificationResponse.ok) {
              const verificationResults = await verificationResponse.json();
              console.log('🔍 DEBUG - Verification results:', verificationResults);
              
              // Compter les résultats depuis le cache
              const cacheHits = Object.values(verificationResults).filter((result: any) => result.cached).length;
              const newVerifications = Object.values(verificationResults).filter((result: any) => !result.cached).length;
              
              console.log(`✅ Optimisation Cache: ${cacheHits} cache hits, ${newVerifications} nouvelles vérifications`);
              
              setInvoiceVerifications(verificationResults);
            } else {
              console.error('❌ Verification failed:', verificationResponse.status);
            }
          } catch (error) {
            console.error('❌ Error verifying invoices:', error);
          }
        } else {
          console.log('🔍 DEBUG - No deliveries with invoices found or invalid array');
        }
      }
      
      // CORRECTION PRODUCTION: Trier spécifiquement par date de livraison validée
      const sorted = filtered.sort((a: any, b: any) => {
        const dateA = a.deliveredDate ? new Date(a.deliveredDate) : null;
        const dateB = b.deliveredDate ? new Date(b.deliveredDate) : null;
        
        // Les livraisons avec deliveredDate en premier, triées par date décroissante
        if (dateA && dateB) {
          // Tri décroissant par deliveredDate (plus récent en premier)
          return dateB.getTime() - dateA.getTime();
        }
        
        // Si une seule a deliveredDate, elle passe en premier
        if (dateA && !dateB) return -1;
        if (!dateA && dateB) return 1;
        
        // Si aucune n'a deliveredDate, trier par scheduledDate puis createdAt
        const fallbackA = a.scheduledDate ? new Date(a.scheduledDate) : new Date(a.createdAt);
        const fallbackB = b.scheduledDate ? new Date(b.scheduledDate) : new Date(b.createdAt);
        return fallbackB.getTime() - fallbackA.getTime();
      });
      
      console.log('🔧 BL Reconciliation - Tri appliqué:', sorted.map(d => ({
        id: d.id,
        supplier: d.supplier?.name,
        deliveredDate: d.deliveredDate,
        scheduledDate: d.scheduledDate
      })).slice(0, 5));
      
      return sorted;
    },
  });

  // Fonction pour vérifier automatiquement les BL sans facture
  const checkPendingInvoices = async () => {
    if (!deliveriesWithBL || deliveriesWithBL.length === 0) return;
    
    // Trouver les livraisons sans référence facture ou avec facture non vérifiée
    const unverifiedDeliveries = deliveriesWithBL.filter((delivery: any) => 
      delivery.blNumber && !delivery.invoiceReference
    );
    
    if (unverifiedDeliveries.length === 0) return;
    
    console.log(`🔍 Checking ${unverifiedDeliveries.length} deliveries for pending invoices...`);
    
    // TODO: Ici on pourrait ajouter une logique pour rechercher automatiquement
    // des factures basées sur les BL numbers ou autres critères
  };

  // Vérification automatique toutes les 30 minutes
  useEffect(() => {
    if (deliveriesWithBL && deliveriesWithBL.length > 0) {
      const interval = setInterval(() => {
        checkPendingInvoices();
      }, 30 * 60 * 1000); // 30 minutes
      
      return () => clearInterval(interval);
    }
  }, [deliveriesWithBL]);

  // ✅ FONCTION OPTIMISÉE - Cache intelligent pour vérification factures
  const verifyAllInvoices = async () => {
    if (!deliveriesWithBL || deliveriesWithBL.length === 0) {
      toast({
        title: "Aucune livraison",
        description: "Aucune livraison trouvée à vérifier",
        variant: "default",
      });
      return;
    }
    
    const invoiceReferencesToVerify = deliveriesWithBL
      .filter((delivery: any) => delivery.invoiceReference && delivery.invoiceReference.trim() !== '' && delivery.groupId)
      .map((delivery: any) => ({
        groupId: delivery.groupId,
        invoiceReference: delivery.invoiceReference,
        deliveryId: delivery.id,
        supplierName: delivery.supplier?.name,
      }));
    
    if (invoiceReferencesToVerify.length > 0) {
      setIsVerifyingInvoices(true);
      try {
        const verificationResponse = await fetch('/api/verify-invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ invoiceReferences: invoiceReferencesToVerify }),
        });
        
        if (verificationResponse.ok) {
          const verificationResults = await verificationResponse.json();
          setInvoiceVerifications(verificationResults);
          
          // Compter optimisation cache
          const cacheHits = Object.values(verificationResults).filter((result: any) => result.cached).length;
          const newVerifications = Object.values(verificationResults).filter((result: any) => !result.cached).length;
          
          toast({
            title: "Vérification optimisée terminée",
            description: `💾 ${cacheHits} cache hits, ⚡ ${newVerifications} nouvelles vérifications`,
          });
        }
      } catch (error) {
        console.error('Error verifying invoice references:', error);
        toast({
          title: "Erreur",
          description: "Impossible de vérifier les factures",
          variant: "destructive",
        });
      } finally {
        setIsVerifyingInvoices(false);
      }
    } else {
      toast({
        title: "Aucune facture à vérifier",
        description: "Aucune référence facture trouvée dans les BL validés",
        variant: "default",
      });
    }
  };

  // ✅ OPTIMISÉ - Vider les vérifications lors du changement de magasin
  // Plus de vérification automatique - seulement vider les anciennes données
  useEffect(() => {
    console.log('🔄 Store changed, clearing invoice verifications for fresh webhook icons');
    setInvoiceVerifications({}); // Clear old verifications only
  }, [selectedStoreId]);

  const form = useForm<ReconciliationForm>({
    resolver: zodResolver(reconciliationSchema),
    defaultValues: {
      blNumber: "",
      blAmount: "",
      invoiceReference: "",
      invoiceAmount: "",
    },
  });

  // ✅ SUPPRIMÉ - Vérification en temps réel qui spammait visuellement
  // La vérification se fait maintenant uniquement à l'enregistrement des données

  const updateReconciliationMutation = useMutation({
    mutationFn: async (data: { id: number; blNumber: string | null; blAmount: string | null; invoiceReference: string | null; invoiceAmount: string | null }) => {
      console.log('🔄 Updating reconciliation data:', data);
      
      // 🔧 CACHE INVALIDATION - Récupérer l'ancienne référence de facture pour vider son cache si elle change
      const originalDelivery = selectedDelivery;
      const oldInvoiceReference = originalDelivery?.invoiceReference;
      const newInvoiceReference = data.invoiceReference?.trim() || null;
      
      console.log('🔍 [CACHE CHECK] Old invoice ref:', oldInvoiceReference, '→ New invoice ref:', newInvoiceReference);
      
      // Si la référence de facture a changé (et qu'il y en avait une avant), vider le cache de l'ancienne
      if (oldInvoiceReference && oldInvoiceReference !== newInvoiceReference) {
        console.log('🗑️ [CACHE CLEAR] Invoice reference changed, clearing cache for old reference:', oldInvoiceReference);
        try {
          await apiRequest(`/api/invoice-verifications/clear-cache/${encodeURIComponent(oldInvoiceReference)}`, 'POST');
          console.log('✅ [CACHE CLEAR] Successfully cleared cache for:', oldInvoiceReference);
          
          // Supprimer la vérification du cache côté client aussi
          setInvoiceVerifications(prev => {
            const updated = { ...prev };
            delete updated[data.id];
            return updated;
          });
          
          toast({
            title: "Cache invalidé",
            description: `Cache vidé pour l'ancienne facture ${oldInvoiceReference}`,
            duration: 3000,
          });
        } catch (error) {
          console.error('❌ [CACHE CLEAR] Failed to clear cache:', error);
        }
      }
      
      const payload = {
        blNumber: data.blNumber,
        blAmount: data.blAmount,
        invoiceReference: data.invoiceReference,
        invoiceAmount: data.invoiceAmount,
      };
      
      console.log('📤 Payload sent to server (null values will clear fields):', payload);
      const response = await apiRequest(`/api/deliveries/${data.id}`, "PUT", payload);
      console.log('✅ Reconciliation update response:', response);
      return response;
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Succès",
        description: "Données de rapprochement mises à jour avec succès",
      });
      // Invalider tous les caches BL/Rapprochement avec toutes les variations de clés
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0] === '/api/deliveries/bl' || 
          query.queryKey[0] === '/api/deliveries'
      });
      
      // Vérifier immédiatement la nouvelle facture si une référence a été ajoutée ou modifiée
      if (variables.invoiceReference && variables.invoiceReference.trim() !== '') {
        const verifyInvoice = async () => {
          try {
            console.log('🔍 Immediate verification for:', variables.invoiceReference);
            
            // 1. Vérifier si la facture existe dans NocoDB
            const verificationResponse = await fetch('/api/verify-invoices', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ 
                invoiceReferences: [{
                  groupId: selectedDelivery?.groupId,
                  invoiceReference: variables.invoiceReference,
                  deliveryId: variables.id,
                  supplierName: selectedDelivery?.supplier?.name,
                }]
              }),
            });

            // 2. Vérifier si la facture est déjà utilisée par une autre livraison
            const usageResponse = await fetch('/api/check-invoice-usage', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ 
                invoiceReference: variables.invoiceReference,
                excludeDeliveryId: variables.id
              }),
            });
            
            let verificationResults = {};
            let usageResult = null;

            if (verificationResponse.ok) {
              verificationResults = await verificationResponse.json();
              console.log('✅ Immediate verification result:', verificationResults);
            }

            if (usageResponse.ok) {
              usageResult = await usageResponse.json();
              console.log('✅ Usage check result:', usageResult);
            }

            // Combiner les résultats
            const result = (verificationResults as any)[variables.id.toString()] || {};
            const finalResult = {
              ...result,
              isUsed: usageResult?.isUsed || false,
              usedBy: usageResult?.usedBy || null
            };

            setInvoiceVerifications(prev => ({ 
              ...prev, 
              [variables.id.toString()]: finalResult
            }));
            
            // Notification du résultat
            if (finalResult.isUsed) {
              toast({
                title: "Facture déjà utilisée",
                description: `La facture ${variables.invoiceReference} est déjà utilisée par la livraison BL ${finalResult.usedBy?.blNumber}`,
                variant: "destructive",
              });
            } else if (finalResult.exists !== undefined) {
              toast({
                title: finalResult.exists ? "Facture trouvée" : "Facture non trouvée",
                description: finalResult.exists ? 
                  `La facture ${variables.invoiceReference} a été trouvée dans NocoDB` :
                  `La facture ${variables.invoiceReference} n'a pas été trouvée dans NocoDB`,
                variant: finalResult.exists ? "default" : "destructive",
              });
            }
          } catch (error) {
            console.error('Error verifying invoice reference:', error);
            toast({
              title: "Erreur de vérification",
              description: "Impossible de vérifier la facture dans NocoDB",
              variant: "destructive",
            });
          }
        };
        
        verifyInvoice();
      }
      
      form.reset();
      setShowReconciliationModal(false);
      setSelectedDelivery(null);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les données de rapprochement",
        variant: "destructive",
      });
    },
  });

  const reconcileMutation = useMutation({
    mutationFn: async (id: number) => {
      console.log('🌐 API Request:', { url: `/api/deliveries/${id}`, method: "PUT", body: { reconciled: true } });
      await apiRequest(`/api/deliveries/${id}`, "PUT", {
        reconciled: true,
      });
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Rapprochement validé avec succès",
      });
      // Invalider tous les caches BL/Rapprochement
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0] === '/api/deliveries/bl' || 
          query.queryKey[0] === '/api/deliveries'
      });
    },
    onError: (error) => {
      console.error('❌ Error reconciling delivery:', error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: `Impossible de valider le rapprochement: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation pour dévalider un rapprochement (Admin uniquement)
  const devalidateDeliveryMutation = useMutation({
    mutationFn: async (deliveryId: number) => {
      const response = await apiRequest(`/api/deliveries/${deliveryId}/devalidate`, "POST", {});
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Rapprochement dévalidé",
        description: "Le rapprochement est maintenant modifiable. Les données sont conservées dans les champs pour permettre les corrections.",
        duration: 4000,
      });
      // Recharger les données
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0] === '/api/deliveries/bl' || 
          query.queryKey[0] === '/api/deliveries'
      });
    },
    onError: (error: any) => {
      console.error("Error devalidating delivery:", error);
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de dévalider la livraison",
        variant: "destructive",
      });
    },
  });

  // Mutation pour envoyer le webhook
  const sendWebhookMutation = useMutation({
    mutationFn: async (data: WebhookForm) => {
      console.log('🚀 Webhook mutation data received:', data);
      console.log('🚀 Selected delivery:', selectedWebhookDelivery);
      console.log('🚀 Selected store ID:', selectedStoreId);
      
      if (!selectedWebhookDelivery?.supplier?.name) {
        throw new Error("Aucun fournisseur sélectionné");
      }
      
      if (!selectedStoreId) {
        throw new Error("Aucun magasin sélectionné");
      }
      
      if (!data.pdfFile || data.pdfFile.length === 0) {
        throw new Error("Aucun fichier PDF sélectionné");
      }
      
      const formData = new FormData();
      formData.append('supplier', selectedWebhookDelivery.supplier.name);
      formData.append('type', data.type);
      formData.append('pdfFile', data.pdfFile[0]);
      // 🔧 CORRECTION CRITIQUE: Ajouter l'ID du groupe sélectionné
      formData.append('selectedGroupId', selectedStoreId.toString());
      // Ajouter informations BL et référence facture pour webhook GET
      formData.append('blNumber', selectedWebhookDelivery.blNumber || 'N/A');
      formData.append('invoiceReference', selectedWebhookDelivery.invoiceReference || 'N/A');
      
      console.log('🚀 FormData contents:');
      for (let pair of formData.entries()) {
        console.log('🚀', pair[0], pair[1]);
      }
      
      console.log('🌐 API Request:', { url: '/api/webhook/send', method: 'POST', formData: 'FormData object' });
      await apiRequest('/api/webhook/send', 'POST', formData);
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Facture envoyé avec succès",
      });
      setShowWebhookModal(false);
      setSelectedWebhookDelivery(null);
      webhookForm.reset();
    },
    onError: (error: any) => {
      console.error('❌ Error sending webhook:', error);
      
      // 🔧 AMÉLIORATION DIAGNOSTIC N8N: Afficher les conseils détaillés
      let displayMessage = `Impossible d'envoyer le webhook: ${error.message}`;
      let troubleshootingTip = '';
      
      // Vérifier si l'erreur contient des informations de diagnostic détaillées
      if (error.troubleshooting) {
        troubleshootingTip = error.troubleshooting;
      }
      
      // Détecter les erreurs spécifiques N8N
      if (error.message && error.message.includes('No item to return was found')) {
        displayMessage = 'Erreur de configuration N8N: Le workflow webhook ne traite pas correctement les données';
        troubleshootingTip = 'Le webhook reçoit les données mais le workflow N8N n\'est pas configuré pour les traiter. Vérifiez que le workflow contient les nœuds appropriés pour traiter les données FormData (fichier PDF + métadonnées JSON).';
      } else if (error.message && error.message.includes('500')) {
        troubleshootingTip = troubleshootingTip || 'Le webhook N8N fonctionne mais rencontre une erreur interne. Vérifiez les logs N8N pour plus de détails.';
      }
      
      console.log('🔍 FRONTEND DIAGNOSTIC N8N:', { displayMessage, troubleshootingTip, technicalDetails: error.technicalDetails });
      
      // Afficher l'erreur principale
      toast({
        title: "Erreur Webhook",
        description: displayMessage,
        variant: "destructive",
      });
      
      // Afficher les conseils de dépannage si disponibles
      if (troubleshootingTip) {
        setTimeout(() => {
          toast({
            title: "💡 Conseil de Dépannage",
            description: troubleshootingTip,
            variant: "default",
          });
        }, 1000);
      }
    },
  });

  const deleteDeliveryMutation = useMutation({
    mutationFn: async (id: number) => {
      console.log('🌐 API Request:', { url: `/api/deliveries/${id}`, method: "DELETE" });
      await apiRequest(`/api/deliveries/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Livraison supprimée avec succès",
      });
      // Invalider tous les caches BL/Rapprochement
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0] === '/api/deliveries/bl' || 
          query.queryKey[0] === '/api/deliveries'
      });
    },
    onError: (error) => {
      console.error('❌ Error deleting delivery:', error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: `Impossible de supprimer la livraison: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleDeleteDelivery = (delivery: any) => {
    setDeliveryToDelete(delivery);
    setShowDeleteModal(true);
  };

  const confirmDeleteDelivery = () => {
    if (deliveryToDelete) {
      deleteDeliveryMutation.mutate(deliveryToDelete.id);
      setShowDeleteModal(false);
      setDeliveryToDelete(null);
    }
  };

  const handleEditReconciliation = (delivery: any) => {
    setSelectedDelivery(delivery);
    // 🔧 CORRECTION FINALE - Afficher les vraies valeurs de la base de données dans le formulaire
    form.reset({
      blNumber: delivery.blNumber || "",
      blAmount: delivery.blAmount || "",
      invoiceReference: delivery.invoiceReference || "",
      invoiceAmount: delivery.invoiceAmount || "",
    });
    setShowReconciliationModal(true);
  };

  const onSubmit = (data: ReconciliationForm) => {
    if (selectedDelivery) {
      updateReconciliationMutation.mutate({
        id: selectedDelivery.id,
        blNumber: data.blNumber?.trim() || null,
        blAmount: data.blAmount?.trim() || null,
        invoiceReference: data.invoiceReference?.trim() || null,
        invoiceAmount: data.invoiceAmount?.trim() || null,
      });
    }
  };

  const calculateDifference = (blAmount: number, invoiceAmount?: number) => {
    if (!invoiceAmount) return null;
    return blAmount - invoiceAmount;
  };

  const getStatusBadge = (delivery: any) => {
    if (delivery.reconciled) {
      return <Badge className="bg-green-100 text-green-800">Validé</Badge>;
    }
    if (delivery.invoiceReference && delivery.invoiceAmount) {
      return <Badge className="bg-blue-100 text-blue-800">Prêt à valider</Badge>;
    }
    if (delivery.invoiceReference) {
      return <Badge className="bg-yellow-100 text-yellow-800">Facture partielle</Badge>;
    }
    return <Badge variant="secondary">En attente</Badge>;
  };

  const canValidate = (delivery: any) => {
    // Vérifier si la facture est déjà utilisée
    const verificationResult = invoiceVerifications[delivery.id];
    if (verificationResult?.isUsed) {
      return false;
    }
    
    return delivery.invoiceReference && delivery.invoiceAmount && !delivery.reconciled;
  };

  const handleValidateReconciliation = (delivery: any) => {
    reconcileMutation.mutate(delivery.id);
  };

  const filteredDeliveries = Array.isArray(deliveriesWithBL) ? deliveriesWithBL.filter((delivery: any) => {
    if (!searchTerm) return true;
    return (
      delivery.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.blNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.invoiceReference?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }) : [];

  // Pagination
  const {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    paginatedData: paginatedDeliveries,
    totalItems
  } = usePagination(filteredDeliveries, 20);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
            <FileText className="w-6 h-6 mr-3 text-blue-600" />
            Rapprochement
          </h2>
          <p className="text-gray-600 mt-1">
            Rapprochement des bons de livraison et factures
          </p>
        </div>
        <Badge variant="outline" className="text-sm border border-gray-300">
          {filteredDeliveries.length} bon(s) de livraison
        </Badge>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher par fournisseur, BL ou facture..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border border-gray-300 shadow-sm"
            />
          </div>
          
          {/* Sélecteur de date */}
          <div className="flex items-center space-x-2">
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal border border-gray-300 shadow-sm",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {selectedDate ? formatDate(selectedDate, "d MMMM yyyy", { locale: fr }) : "Filtrer par date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <DayPicker
                  mode="single"
                  selected={selectedDate || undefined}
                  onSelect={(date) => {
                    setSelectedDate(date || null);
                    setIsDatePickerOpen(false);
                  }}
                  locale={fr}
                  className="rounded-md border"
                />
              </PopoverContent>
            </Popover>
            
            {selectedDate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(null)}
                className="h-9 px-2"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={verifyAllInvoices}
              disabled={isVerifyingInvoices}
              className="h-9 px-3"
              title="Actualiser la vérification (utilise le cache intelligent)"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isVerifyingInvoices ? 'animate-spin' : ''}`} />
              Actualiser vérifications
            </Button>
            

          </div>
        </div>
      </div>



      {/* Deliveries List */}
      {filteredDeliveries.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <FileText className="w-16 h-16 mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">Aucun BL trouvé</h3>
          <p className="text-center max-w-md">
            {searchTerm 
              ? "Aucun BL ne correspond à vos critères de recherche."
              : "Aucun BL disponible pour le rapprochement."}
          </p>
        </div>
      ) : (
        <>
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
          
          <div className="bg-white border border-gray-200 shadow-lg overflow-hidden">
            <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                      Fournisseur
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      N° BL
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                      Date Livr.
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                      Date Valid.
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                      Montant BL
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                      Ref. Facture
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                      Montant Fact.
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Écart
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Magasin
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedDeliveries.map((delivery: any) => {
                    const difference = calculateDifference(
                      parseFloat(delivery.blAmount || '0'),
                      delivery.invoiceAmount ? parseFloat(delivery.invoiceAmount) : undefined
                    );
                    
                    return (
                      <tr 
                        key={delivery.id} 
                        className={`hover:bg-gray-50 ${delivery.reconciled ? 'bg-gray-100 text-gray-600' : ''}`}
                      >
                        <td className="px-3 py-2 text-sm">
                          <div className="font-medium text-gray-900 truncate max-w-32">
                            {delivery.supplier?.name}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm">
                          <div className="text-gray-900">
                            {delivery.blNumber || (
                              <div className="flex items-center space-x-1">
                                <span className="text-gray-400 italic text-xs">Non renseigné</span>
                                <button
                                  onClick={() => handleEditReconciliation(delivery)}
                                  disabled={updateReconciliationMutation.isPending}
                                  className="text-gray-400 hover:text-blue-600 transition-colors duration-200 flex items-center justify-center w-5 h-5 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Ajouter un numéro de BL"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm">
                          <div className="text-gray-900">
                            {safeFormat(delivery.scheduledDate, 'dd/MM/yy')}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm">
                          <div className="text-gray-900">
                            {delivery.reconciled && delivery.updatedAt ? 
                              safeFormat(delivery.updatedAt, 'dd/MM/yy') : 
                              '-'
                            }
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm">
                          <div className="font-medium text-gray-900">
                            {delivery.blAmount ? 
                              `${parseFloat(delivery.blAmount).toFixed(2)}€` :
                              (
                                <div className="flex items-center space-x-1">
                                  <span className="text-gray-400 italic text-xs">Non renseigné</span>
                                  <button
                                    onClick={() => handleEditReconciliation(delivery)}
                                    disabled={updateReconciliationMutation.isPending}
                                    className="text-gray-400 hover:text-blue-600 transition-colors duration-200 flex items-center justify-center w-5 h-5 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Ajouter un montant BL"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              )
                            }
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm">
                          <div className="text-gray-900">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {delivery.invoiceReference ? (
                                  <>
                                    {/* ICÔNE VÉRIFICATION FACTURE À GAUCHE */}
                                    {(() => {
                                      const verificationKey = delivery.id.toString();
                                      const verification = invoiceVerifications[verificationKey];
                                      
                                      if (verification) {
                                        // Affichage de l'icône de vérification NocoDB à gauche
                                        if (verification.exists === true) {
                                          return (
                                            <div title="Facture trouvée dans NocoDB">
                                              <CheckCircle className="w-4 h-4 text-green-600" />
                                            </div>
                                          );
                                        } else if (verification.error) {
                                          return (
                                            <div title={`Erreur de configuration: ${verification.error}`}>
                                              <AlertTriangle className="w-4 h-4 text-orange-500" />
                                            </div>
                                          );
                                        } else {
                                          return (
                                            <div className="flex items-center space-x-1">
                                              <div title="Facture non trouvée dans NocoDB">
                                                <X className="w-4 h-4 text-red-600" />
                                              </div>
                                              {(user as any)?.role === 'admin' && (
                                                <button
                                                  onClick={async () => {
                                                    try {
                                                      const response = await fetch(`/api/verify-invoices/cache/${delivery.invoiceReference}`, {
                                                        method: 'DELETE',
                                                        credentials: 'include'
                                                      });
                                                      
                                                      if (response.ok) {
                                                        toast({
                                                          title: "Cache vidé",
                                                          description: `Cache vidé pour ${delivery.invoiceReference}. Nouvelle vérification en cours...`,
                                                          duration: 3000,
                                                        });
                                                        
                                                        // Forcer une nouvelle vérification
                                                        const verifyResponse = await fetch('/api/verify-invoices', {
                                                          method: 'POST',
                                                          headers: { 'Content-Type': 'application/json' },
                                                          credentials: 'include',
                                                          body: JSON.stringify({ 
                                                            invoiceReferences: [{
                                                              groupId: delivery.groupId,
                                                              invoiceReference: delivery.invoiceReference,
                                                              deliveryId: delivery.id,
                                                              supplierName: delivery.supplier?.name
                                                            }]
                                                          }),
                                                        });
                                                        
                                                        if (verifyResponse.ok) {
                                                          const newResults = await verifyResponse.json();
                                                          setInvoiceVerifications(prev => ({
                                                            ...prev,
                                                            ...newResults
                                                          }));
                                                          
                                                          toast({
                                                            title: "Vérification mise à jour",
                                                            description: "Nouvelle vérification terminée",
                                                            duration: 3000,
                                                          });
                                                        }
                                                      }
                                                    } catch (error) {
                                                      console.error('Error clearing cache:', error);
                                                      toast({
                                                        title: "Erreur",
                                                        description: "Impossible de vider le cache",
                                                        variant: "destructive",
                                                      });
                                                    }
                                                  }}
                                                  className="text-gray-400 hover:text-blue-600 transition-colors duration-200"
                                                  title="Vider le cache et re-vérifier cette facture"
                                                >
                                                  <RefreshCw className="w-3 h-3" />
                                                </button>
                                              )}
                                            </div>
                                          );
                                        }
                                      } else if (!delivery.groupId) {
                                        return (
                                          <div title="Aucun magasin assigné - impossible de vérifier">
                                            <AlertTriangle className="w-4 h-4 text-gray-400" />
                                          </div>
                                        );
                                      }
                                      return null;
                                    })()}
                                    <span className="truncate max-w-28">{delivery.invoiceReference}</span>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => handleEditReconciliation(delivery)}
                                    disabled={updateReconciliationMutation.isPending}
                                    className="text-gray-400 hover:text-blue-600 transition-colors duration-200 flex items-center justify-center w-6 h-6 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Ajouter une référence facture"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              
                              {/* ICÔNE WEBHOOK - Masqué SEULEMENT si coche verte */}
                              {(() => {
                                const hasWebhookUrl = !!(delivery.group?.webhookUrl);
                                const verificationKey = delivery.id.toString();
                                const verification = invoiceVerifications[verificationKey];
                                const hasGreenCheck = verification && verification.exists === true;
                                
                                // Afficher l'icône webhook dans tous les cas SAUF coche verte :
                                // ✅ Pas de vérification (pas d'icône) → Webhook visible
                                // ❌ X rouge (facture non trouvée) → Webhook visible  
                                // ⚠️ Triangle orange (erreur config) → Webhook visible
                                // ✅ Coche verte (facture trouvée) → Webhook masqué
                                if (hasWebhookUrl && !hasGreenCheck) {
                                  return (
                                    <button
                                      onClick={() => {
                                        setSelectedWebhookDelivery(delivery);
                                        setShowWebhookModal(true);
                                      }}
                                      className="text-gray-600 hover:text-gray-800 transition-colors duration-200 ml-1 border border-gray-300 rounded p-0.5"
                                      title="Envoyer facture via webhook"
                                    >
                                      <Send className="w-4 h-4" />
                                    </button>
                                  );
                                }
                                
                                return null;
                              })()}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm">
                          <div className="text-gray-900">
                            {delivery.invoiceAmount ? 
                              `${parseFloat(delivery.invoiceAmount).toFixed(2)}€` : 
                              <button
                                onClick={() => handleEditReconciliation(delivery)}
                                disabled={updateReconciliationMutation.isPending}
                                className="text-gray-400 hover:text-blue-600 transition-colors duration-200 flex items-center justify-center w-6 h-6 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Ajouter un montant facture"
                              >
                                <Euro className="w-3.5 h-3.5" />
                              </button>
                            }
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm">
                          <div className={`font-medium ${
                            difference === null ? 'text-gray-400' :
                            difference === 0 ? 'text-green-600' :
                            difference > 0 ? 'text-orange-600' : 'text-red-600'
                          }`}>
                            {difference === null ? '-' : `${difference.toFixed(2)}€`}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm">
                          <div className="flex items-center space-x-1">
                            <div 
                              className="w-2 h-2" 
                              style={{ backgroundColor: delivery.group?.color }}
                            />
                            <span className="text-gray-900 text-xs truncate max-w-16">{delivery.group?.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm">
                          <div className="flex items-center justify-end space-x-1">
                            {getStatusBadge(delivery)}
                            {!delivery.reconciled && (
                              <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditReconciliation(delivery)}
                                disabled={updateReconciliationMutation.isPending}
                                className="px-2 py-1 text-xs"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Modifier
                              </Button>
                              {canValidate(delivery) && (
                                <Button
                                  size="sm"
                                  onClick={() => handleValidateReconciliation(delivery)}
                                  disabled={reconcileMutation.isPending}
                                  className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 text-xs"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Valider
                                </Button>
                              )}
                            </>
                          )}
                          {(user as any)?.role === 'admin' && (
                            <>
                              {delivery.reconciled && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => devalidateDeliveryMutation.mutate(delivery.id)}
                                  disabled={devalidateDeliveryMutation.isPending}
                                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 px-2 py-1 text-xs"
                                  title="Dévalider le rapprochement (rendre modifiable, garde les données)"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteDelivery(delivery)}
                                disabled={deleteDeliveryMutation.isPending}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 text-xs"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
          
          {/* Pagination du bas */}
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        </>
      )}

      {/* Reconciliation Modal */}
      <Dialog open={showReconciliationModal} onOpenChange={setShowReconciliationModal}>
        <DialogContent className="sm:max-w-lg" aria-describedby="reconciliation-modal-description">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-primary" />
              <span>Modifier les données de rapprochement</span>
            </DialogTitle>
            <p id="reconciliation-modal-description" className="text-sm text-gray-600 mt-1">
              Modifier les informations du bon de livraison et de la facture
            </p>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Informations générales */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-gray-900">Informations générales</h4>
                <div className="text-sm text-gray-600">
                  <p><strong>Fournisseur:</strong> {selectedDelivery?.supplier?.name}</p>
                  <p><strong>Magasin:</strong> {selectedDelivery?.group?.name}</p>
                </div>
              </div>

              {/* Données BL */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 border-b pb-2">Bon de livraison</h4>
                
                <FormField
                  control={form.control}
                  name="blNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro de BL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: BL-2024-001"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="blAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Montant BL (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          placeholder="Ex: 1250.50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Données facture */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 border-b pb-2">Facture</h4>
                
                <FormField
                  control={form.control}
                  name="invoiceReference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Référence Facture</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="Ex: FAC-2024-001"
                            {...field}
                          />
                          {/* Indicateur de vérification en temps réel */}
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                            {isVerifyingCurrentInvoice && (
                              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                            )}
                            {!isVerifyingCurrentInvoice && field.value && field.value.trim() && selectedDelivery && invoiceVerifications[selectedDelivery.id.toString()] && (
                              <div className="flex items-center space-x-1">
                                {invoiceVerifications[selectedDelivery.id.toString()].isUsed ? (
                                  <div title={`Facture déjà utilisée par BL ${invoiceVerifications[selectedDelivery.id.toString()].usedBy?.blNumber}`}>
                                    <AlertTriangle className="w-4 h-4 text-red-600" />
                                  </div>
                                ) : invoiceVerifications[selectedDelivery.id.toString()].exists ? (
                                  <div title="Facture trouvée dans NocoDB">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  </div>
                                ) : (
                                  <div title="Facture non trouvée dans NocoDB">
                                    <X className="w-4 h-4 text-red-500" />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                      {/* Status de vérification */}
                      {!isVerifyingCurrentInvoice && field.value && field.value.trim() && selectedDelivery && invoiceVerifications[selectedDelivery.id.toString()] && (
                        <div className="mt-2">
                          {invoiceVerifications[selectedDelivery.id.toString()].isUsed ? (
                            <div className="space-y-1">
                              <p className="text-sm text-red-600 flex items-center space-x-1">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Facture déjà utilisée</span>
                              </p>
                              <p className="text-xs text-gray-500 ml-4">
                                Utilisée par la livraison BL {invoiceVerifications[selectedDelivery.id.toString()].usedBy?.blNumber}
                                {invoiceVerifications[selectedDelivery.id.toString()].usedBy?.supplierName && 
                                  ` (${invoiceVerifications[selectedDelivery.id.toString()].usedBy.supplierName})`
                                }
                              </p>
                            </div>
                          ) : invoiceVerifications[selectedDelivery.id.toString()].exists ? (
                            <p className="text-sm text-green-600 flex items-center space-x-1">
                              <CheckCircle className="w-3 h-3" />
                              <span>Facture trouvée dans NocoDB</span>
                            </p>
                          ) : (
                            <p className="text-sm text-red-600 flex items-center space-x-1">
                              <X className="w-3 h-3" />
                              <span>Facture non trouvée dans NocoDB</span>
                            </p>
                          )}
                        </div>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="invoiceAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Montant Facture (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          placeholder="Ex: 1250.50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Aperçu de l'écart */}
              {form.watch("blAmount") && form.watch("invoiceAmount") && (
                <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                  <h4 className="font-medium text-gray-900">Aperçu de l'écart</h4>
                  <div className="text-sm">
                    <p><strong>Montant BL:</strong> {parseFloat(form.watch("blAmount") || "0").toFixed(2)} €</p>
                    <p><strong>Montant Facture:</strong> {parseFloat(form.watch("invoiceAmount") || "0").toFixed(2)} €</p>
                    <p className={`font-medium ${
                      Math.abs(parseFloat(form.watch("blAmount") || "0") - parseFloat(form.watch("invoiceAmount") || "0")) < 0.01 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      <strong>Écart:</strong> {(parseFloat(form.watch("blAmount") || "0") - parseFloat(form.watch("invoiceAmount") || "0")).toFixed(2)} €
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowReconciliationModal(false)}
                  disabled={updateReconciliationMutation.isPending}
                >
                  Annuler
                </Button>
                <Button 
                  type="submit"
                  disabled={updateReconciliationMutation.isPending}
                >
                  {updateReconciliationMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmation de suppression */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeliveryToDelete(null);
        }}
        onConfirm={confirmDeleteDelivery}
        title="Supprimer la livraison"
        description="Êtes-vous sûr de vouloir supprimer cette livraison du module rapprochement ?"
        itemName={deliveryToDelete ? `${deliveryToDelete.supplier?.name} - BL ${deliveryToDelete.blNumber}` : undefined}
        isLoading={deleteDeliveryMutation.isPending}
      />

      {/* Modal Webhook */}
      <Dialog open={showWebhookModal} onOpenChange={setShowWebhookModal}>
        <DialogContent className="sm:max-w-md z-[60]">
          {/* Overlay de chargement */}
          {sendWebhookMutation.isPending && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[61] rounded-lg">
              <div className="bg-white rounded-lg p-6 flex flex-col items-center space-y-3 shadow-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-700 font-medium">Envoi de la Facture en cours</p>
              </div>
            </div>
          )}
          
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Send className="w-5 h-5" />
              <span>Envoyer Facture/Avoir</span>
            </DialogTitle>
          </DialogHeader>
          
          <Form {...webhookForm}>
            <form 
              onSubmit={webhookForm.handleSubmit((data) => sendWebhookMutation.mutate(data))}
              className="space-y-4"
            >
              {/* Informations de la livraison */}
              {selectedWebhookDelivery && (
                <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Fournisseur:</span> {selectedWebhookDelivery.supplier?.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Référence facture:</span> {selectedWebhookDelivery.invoiceReference}
                  </p>
                </div>
              )}

              {/* Sélecteur de type */}
              <FormField
                control={webhookForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Facture">Facture</SelectItem>
                        <SelectItem value="Avoir">Avoir</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Upload de fichier PDF */}
              <FormField
                control={webhookForm.control}
                name="pdfFile"
                render={({ field: { onChange, value, ...field } }) => (
                  <FormItem>
                    <FormLabel>Fichier PDF</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => onChange(e.target.files)}
                          {...field}
                          className="cursor-pointer"
                        />
                        <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowWebhookModal(false)}
                  disabled={sendWebhookMutation.isPending}
                >
                  Annuler
                </Button>
                <Button 
                  type="submit"
                  disabled={sendWebhookMutation.isPending}
                >
                  {sendWebhookMutation.isPending ? "Envoi..." : "Envoyer"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>


    </div>
  );
}