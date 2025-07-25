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
  
  // States pour le test BL simplifié
  const [testBlNumber, setTestBlNumber] = useState('');
  const [testBlSupplier, setTestBlSupplier] = useState('');
  const [testBlGroupId, setTestBlGroupId] = useState('');
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

  // Mutation pour tester la vérification BL simplifiée
  const testBlMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/nocodb/verify-bl`, {
        method: 'POST',
        body: {
          blNumber: testBlNumber.trim(),
          supplierName: testBlSupplier.trim(),
          groupId: parseInt(testBlGroupId)
        }
      });
      return response;
    },
    onError: (error: any) => {
      toast({
        title: "Erreur lors du test BL",
        description: error.message || "Une erreur s'est produite lors du test du BL",
        variant: "destructive",
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

  const handleTestBL = () => {
    if (!testBlNumber || !testBlSupplier || !testBlGroupId) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs pour le test BL",
        variant: "destructive"
      });
      return;
    }

    console.log('🔍 Diagnostic BL - Données envoyées:', {
      blNumber: testBlNumber,
      supplierName: testBlSupplier,
      groupId: parseInt(testBlGroupId)
    });

    testBlMutation.mutate();
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

            {/* Information de Configuration BL */}
            {groupId && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Configuration BL pour ce magasin
                </h4>
                {(() => {
                  const selectedGroup = (groups as any[]).find((g: any) => g.id.toString() === groupId);
                  if (!selectedGroup) return <p className="text-sm text-blue-700">Magasin non trouvé</p>;
                  
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-blue-800">Table NocoDB:</span>
                        <div className="text-blue-700">{selectedGroup.nocodbTableName || 'Non configuré'}</div>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">ID Table:</span>
                        <div className="text-blue-700 font-mono text-xs">{selectedGroup.nocodbTableId || 'Non configuré'}</div>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">Colonne N° BL:</span>
                        <div className="text-blue-700">{selectedGroup.nocodbBlColumnName || 'Non configuré'}</div>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">Colonne Montant:</span>
                        <div className="text-blue-700">{selectedGroup.nocodbAmountColumnName || 'Non configuré'}</div>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">Colonne Fournisseur:</span>
                        <div className="text-blue-700">{selectedGroup.nocodbSupplierColumnName || 'Non configuré'}</div>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">Colonne Facture:</span>
                        <div className="text-blue-700">{selectedGroup.invoiceColumnName || 'Non configuré'}</div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

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

            {/* Section Processus de Vérification BL */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Processus de Vérification BL (Bon de Livraison)
              </h4>
              <div className="text-sm text-gray-700 space-y-2">
                <div>
                  <span className="font-medium">Étape 1:</span> Recherche par numéro de BL exact dans la colonne configurée
                </div>
                <div>
                  <span className="font-medium">Étape 2:</span> Vérification que le fournisseur correspond
                </div>
                <div>
                  <span className="font-medium">Étape 3:</span> Si tout correspond, récupération du numéro de facture et montant
                </div>
                <div>
                  <span className="font-medium">Sécurité:</span> Vérification obligatoire de la correspondance fournisseur
                </div>
                <div>
                  <span className="font-medium">Retry:</span> 3 tentatives automatiques avec délai exponentiel en cas d'erreur DNS
                </div>
                <div className="mt-3 p-3 bg-blue-100 rounded border border-blue-300">
                  <div className="font-medium text-blue-800 mb-1">Types de correspondance:</div>
                  <div className="text-xs text-blue-700 space-y-1">
                    <div><code>INVOICE_REF</code>: Trouvé par référence facture</div>
                    <div><code>BL_NUMBER</code>: Trouvé par numéro de BL</div>
                    <div><code>SUPPLIER_AMOUNT</code>: Trouvé par fournisseur + montant</div>
                    <div><code>SUPPLIER_DATE</code>: Trouvé par fournisseur + date</div>
                    <div><code>NONE</code>: Aucune correspondance trouvée</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section Test BL Simplifié */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Test Vérification BL Simplifiée
            </CardTitle>
            <CardDescription>
              Tester la nouvelle logique de vérification par numéro de BL
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="test-bl-number">Numéro BL</Label>
                <Input
                  id="test-bl-number"
                  placeholder="Ex: BL2025001"
                  value={testBlNumber}
                  onChange={(e) => setTestBlNumber(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="test-bl-supplier">Fournisseur</Label>
                <Input
                  id="test-bl-supplier"
                  placeholder="Ex: Lidis"
                  value={testBlSupplier}
                  onChange={(e) => setTestBlSupplier(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="test-bl-group">Magasin/Groupe</Label>
                <select
                  id="test-bl-group"
                  className="w-full p-2 border rounded"
                  value={testBlGroupId}
                  onChange={(e) => setTestBlGroupId(e.target.value)}
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
              onClick={handleTestBL}
              disabled={testBlMutation.isPending}
              className="w-full"
            >
              {testBlMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Test en cours...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Tester Vérification BL
                </>
              )}
            </Button>

            {/* Résultat du test BL */}
            {testBlMutation.data && (
              <div className="mt-4 p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {testBlMutation.data.found ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="font-medium">
                    {testBlMutation.data.found ? 'BL trouvé et vérifié' : 'BL non trouvé ou fournisseur incorrect'}
                  </span>
                  {testBlMutation.data.matchType && (
                    <Badge variant="outline">
                      {testBlMutation.data.matchType}
                    </Badge>
                  )}
                </div>
                {testBlMutation.data.found && testBlMutation.data.verificationDetails && (
                  <div className="bg-green-50 p-3 rounded border border-green-200 mb-3">
                    <div className="font-medium text-green-800 mb-2">Résultat de la vérification:</div>
                    <div className="space-y-1 text-sm text-green-700">
                      {testBlMutation.data.verificationDetails.invoiceRef && (
                        <div><strong>Numéro de facture:</strong> {testBlMutation.data.verificationDetails.invoiceRef}</div>
                      )}
                      {testBlMutation.data.verificationDetails.amount && (
                        <div><strong>Montant:</strong> {testBlMutation.data.verificationDetails.amount}€</div>
                      )}
                      <div><strong>BL trouvé:</strong> {testBlMutation.data.verificationDetails.blNumber}</div>
                      <div><strong>Fournisseur vérifié:</strong> {testBlMutation.data.verificationDetails.supplierName}</div>
                    </div>
                  </div>
                )}
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(testBlMutation.data.verificationDetails, null, 2)}
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