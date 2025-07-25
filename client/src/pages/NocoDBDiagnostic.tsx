import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, Search, TestTube, FileText, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface VerificationResult {
  found: boolean;
  matchType?: 'INVOICE_REF' | 'BL_NUMBER' | 'SUPPLIER_AMOUNT' | 'SUPPLIER_DATE' | 'NONE';
  invoice?: any;
  verificationDetails: {
    invoiceRef?: string;
    blNumber?: string;
    supplierName?: string;
    amount?: number;
    searchUrl?: string;
    searchCriteria?: any;
    responseData?: any;
    error?: string;
  };
}

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  operation: string;
  data?: any;
  error?: string;
}

export default function NocoDBDiagnostic() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // States pour le formulaire de vérification
  const [invoiceRef, setInvoiceRef] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [amount, setAmount] = useState('');
  const [groupId, setGroupId] = useState('');

  // Récupération des groupes
  const { data: groups = [] } = useQuery({
    queryKey: ['/api/groups'],
  });

  // Récupération des configurations NocoDB
  const { data: nocodbConfigs = [] } = useQuery({
    queryKey: ['/api/nocodb-config'],
  });

  // Récupération des logs récents
  const { data: logsData, refetch: refetchLogs } = useQuery({
    queryKey: ['/api/nocodb/logs'],
    queryFn: () => apiRequest('/api/nocodb/logs?lines=50'),
  });

  // Mutation pour vérifier une facture
  const verifyInvoiceMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/nocodb/verify-invoice', 'POST', data),
    onSuccess: (result: VerificationResult) => {
      refetchLogs();
      toast({
        title: result.found ? "Facture trouvée !" : "Facture non trouvée",
        description: result.found 
          ? `Correspondance trouvée via ${result.matchType}`
          : "Aucune correspondance dans NocoDB",
        variant: result.found ? "default" : "destructive"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de vérification",
        description: error.message || "Erreur lors de la vérification",
        variant: "destructive"
      });
    }
  });

  // Mutation pour tester une connexion NocoDB
  const testConnectionMutation = useMutation({
    mutationFn: (configId: number) => apiRequest('/api/nocodb/test-connection', 'POST', { configId }),
    onSuccess: (result: any) => {
      console.log('🔍 Test connection result:', result);
      refetchLogs();
      toast({
        title: result.success ? "Connexion réussie" : "Connexion échouée",
        description: result.success 
          ? "La connexion à NocoDB fonctionne" 
          : result.message || result.error || "Erreur inconnue",
        variant: result.success ? "default" : "destructive"
      });
    },
    onError: (error: any) => {
      console.error('❌ Test connection error:', error);
      refetchLogs();
      toast({
        title: "Erreur de test",
        description: error.message || "Erreur lors du test de connexion",
        variant: "destructive"
      });
    }
  });

  // Mutation pour nettoyer les logs
  const cleanLogsMutation = useMutation({
    mutationFn: (daysToKeep: number) => apiRequest('/api/nocodb/logs/cleanup', 'POST', { daysToKeep }),
    onSuccess: () => {
      refetchLogs();
      toast({
        title: "Logs nettoyés",
        description: "Les anciens logs ont été supprimés",
      });
    }
  });

  const handleVerifyInvoice = () => {
    if (!invoiceRef || !supplierName || !amount || !groupId) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    console.log('🔍 Diagnostic - Données envoyées:', {
      invoiceRef,
      supplierName,
      amount: parseFloat(amount),
      groupId: parseInt(groupId)
    });

    verifyInvoiceMutation.mutate({
      invoiceRef,
      supplierName,
      amount: parseFloat(amount),
      groupId: parseInt(groupId)
    });
  };

  const getLogLevelBadge = (level: string) => {
    const colors = {
      INFO: 'bg-blue-100 text-blue-800',
      WARN: 'bg-yellow-100 text-yellow-800',
      ERROR: 'bg-red-100 text-red-800',
      DEBUG: 'bg-gray-100 text-gray-800'
    };
    return colors[level as keyof typeof colors] || colors.DEBUG;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Diagnostic NocoDB</h1>
          <p className="text-muted-foreground">
            Système de logging et vérification des factures/BL
          </p>
        </div>
        <Button
          onClick={() => refetchLogs()}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section Vérification de Facture */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Vérification de Facture/BL
            </CardTitle>
            <CardDescription>
              Tester la recherche d'une facture dans NocoDB avec logging complet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invoiceRef">Référence Facture</Label>
                <Input
                  id="invoiceRef"
                  value={invoiceRef}
                  onChange={(e) => setInvoiceRef(e.target.value)}
                  placeholder="ex: FAC123456"
                />
              </div>
              <div>
                <Label htmlFor="supplierName">Fournisseur</Label>
                <Input
                  id="supplierName"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="ex: CMP"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Montant (€)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="ex: 1200.00"
                />
              </div>
              <div>
                <Label htmlFor="groupId">Magasin</Label>
                <select
                  id="groupId"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="">Sélectionner un magasin</option>
                  {(groups as any[]).map((group: any) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              onClick={handleVerifyInvoice}
              disabled={verifyInvoiceMutation.isPending}
              className="w-full"
            >
              {verifyInvoiceMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Vérification...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Vérifier la Facture
                </>
              )}
            </Button>

            {/* Résultat de la vérification */}
            {verifyInvoiceMutation.data && (
              <div className="mt-4 p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {verifyInvoiceMutation.data.found ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="font-medium">
                    {verifyInvoiceMutation.data.found ? 'Facture trouvée' : 'Facture non trouvée'}
                  </span>
                  {verifyInvoiceMutation.data.matchType && (
                    <Badge variant="outline">
                      {verifyInvoiceMutation.data.matchType}
                    </Badge>
                  )}
                </div>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(verifyInvoiceMutation.data.verificationDetails, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section Test de Connexion */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Test de Connexion NocoDB
            </CardTitle>
            <CardDescription>
              Tester la connectivité aux configurations NocoDB
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(nocodbConfigs as any[]).length === 0 ? (
              <p className="text-muted-foreground">Aucune configuration NocoDB trouvée</p>
            ) : (
              <div className="space-y-2">
                {(nocodbConfigs as any[]).map((config: any) => (
                  <div
                    key={config.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{config.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {config.baseUrl}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => testConnectionMutation.mutate(config.id)}
                      disabled={testConnectionMutation.isPending}
                    >
                      {testConnectionMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <TestTube className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Logs NocoDB Récents
          </CardTitle>
          <CardDescription>
            Historique détaillé des opérations NocoDB avec diagnostic complet
          </CardDescription>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => cleanLogsMutation.mutate(7)}
              disabled={cleanLogsMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Nettoyer (7 jours)
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetchLogs()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {logsData?.logs?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Aucun log disponible
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-auto">
              {logsData?.logs?.map((logLine: string, index: number) => {
                try {
                  // Parser la ligne de log
                  const timestampMatch = logLine.match(/^\[([^\]]+)\]/);
                  const levelMatch = logLine.match(/\[([A-Z]+)\]/);
                  const operationMatch = logLine.match(/\[([A-Z_]+)\]/g);
                  
                  const timestamp = timestampMatch?.[1] || '';
                  const level = levelMatch?.[1] || 'INFO';
                  const operation = operationMatch?.[operationMatch.length - 1]?.replace(/[\[\]]/g, '') || '';
                  
                  return (
                    <div
                      key={index}
                      className="p-3 border rounded-lg text-sm"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getLogLevelBadge(level)}>
                          {level}
                        </Badge>
                        <span className="font-mono text-xs text-muted-foreground">
                          {new Date(timestamp).toLocaleString()}
                        </span>
                        <span className="font-medium">{operation}</span>
                      </div>
                      <pre className="font-mono text-xs text-muted-foreground whitespace-pre-wrap">
                        {logLine}
                      </pre>
                    </div>
                  );
                } catch {
                  return (
                    <div
                      key={index}
                      className="p-2 border rounded text-xs font-mono"
                    >
                      {logLine}
                    </div>
                  );
                }
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}