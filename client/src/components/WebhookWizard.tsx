import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wand2, 
  CheckCircle, 
  AlertTriangle, 
  Settings, 
  Globe, 
  Shield, 
  ArrowRight,
  Copy,
  ExternalLink,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface WebhookWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Group {
  id: number;
  name: string;
  color: string;
  webhookUrl?: string;
}

const WebhookWizard: React.FC<WebhookWizardProps> = ({ open, onOpenChange }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer les groupes
  const { data: groups = [] } = useQuery<Group[]>({
    queryKey: ['/api/groups'],
    queryFn: () => apiRequest('/api/groups')
  });

  // Mutation pour sauvegarder la configuration webhook
  const saveWebhookMutation = useMutation({
    mutationFn: async ({ groupId, url }: { groupId: number; url: string }) => {
      return apiRequest(`/api/groups/${groupId}`, {
        method: 'PUT',
        body: JSON.stringify({ webhookUrl: url })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
      toast({
        title: "Configuration sauvegardée",
        description: "URL webhook configurée avec succès",
      });
      setCurrentStep(currentStep + 1);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration",
        variant: "destructive"
      });
    }
  });

  // Mutation pour tester le webhook
  const testWebhookMutation = useMutation({
    mutationFn: async (url: string) => {
      const testData = {
        test: true,
        timestamp: new Date().toISOString(),
        message: "Test depuis l'Assistant Webhook LogiFlow"
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });
      
      return {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      };
    },
    onSuccess: (result) => {
      setTestResult(result);
      if (result.ok) {
        toast({
          title: "Test réussi",
          description: `Webhook répond correctement (${result.status})`,
        });
      } else {
        toast({
          title: "Test échoué",
          description: `Erreur ${result.status}: ${result.statusText}`,
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      setTestResult({ error: error.message });
      toast({
        title: "Test échoué",
        description: "Impossible de contacter l'URL webhook",
        variant: "destructive"
      });
    }
  });

  const steps = [
    {
      title: "Sélection du magasin",
      description: "Choisissez le magasin à configurer",
      icon: Settings
    },
    {
      title: "Configuration URL",
      description: "Définissez l'URL de votre webhook",
      icon: Globe
    },
    {
      title: "Test de connexion",
      description: "Vérifiez que votre webhook fonctionne",
      icon: Shield
    },
    {
      title: "Finalisation",
      description: "Configuration terminée avec succès",
      icon: CheckCircle
    }
  ];

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  const resetWizard = () => {
    setCurrentStep(0);
    setSelectedGroupId(null);
    setWebhookUrl('');
    setTestResult(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copié",
      description: "URL copiée dans le presse-papiers",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Wand2 className="w-6 h-6 mr-2 text-purple-600" />
            Assistant Configuration Webhook
          </DialogTitle>
          <DialogDescription>
            Configuration guidée des webhooks pour notifications PDF automatisées
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div key={index} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full
                    ${isActive ? 'bg-purple-600 text-white' : 
                      isCompleted ? 'bg-green-600 text-white' : 
                      'bg-gray-200 text-gray-500'}
                  `}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {index < steps.length - 1 && (
                    <ArrowRight className="w-4 h-4 mx-4 text-gray-400" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step Content */}
          <Card>
            <CardHeader>
              <CardTitle>{steps[currentStep].title}</CardTitle>
              <CardDescription>{steps[currentStep].description}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Étape 0: Sélection du magasin */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <Label>Sélectionnez le magasin à configurer</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groups.map((group) => (
                      <Card 
                        key={group.id}
                        className={`cursor-pointer transition-all ${
                          selectedGroupId === group.id 
                            ? 'ring-2 ring-purple-600 bg-purple-50' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          setSelectedGroupId(group.id);
                          if (group.webhookUrl) {
                            setWebhookUrl(group.webhookUrl);
                          }
                        }}
                      >
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: group.color }}
                            />
                            <span className="font-medium">{group.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {group.webhookUrl ? (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                Configuré
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-orange-600 border-orange-600">
                                Non configuré
                              </Badge>
                            )}
                            {selectedGroupId === group.id && (
                              <CheckCircle className="w-5 h-5 text-purple-600" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      onClick={() => setCurrentStep(1)}
                      disabled={!selectedGroupId}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Continuer
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Étape 1: Configuration URL */}
              {currentStep === 1 && selectedGroup && (
                <div className="space-y-6">
                  <Alert>
                    <Zap className="h-4 w-4" />
                    <AlertDescription>
                      Configuration pour le magasin <strong>{selectedGroup.name}</strong>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <Label htmlFor="webhook-url">URL du webhook</Label>
                    <Input
                      id="webhook-url"
                      placeholder="https://votre-serveur.com/webhook/factures"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="font-mono text-sm"
                    />
                    <div className="text-sm text-gray-600">
                      <p className="mb-2"><strong>Format attendu :</strong></p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>URL HTTPS recommandée pour la sécurité</li>
                        <li>Endpoint accessible depuis internet</li>
                        <li>Accepte les requêtes POST avec fichiers PDF</li>
                      </ul>
                    </div>
                  </div>

                  <Tabs defaultValue="example" className="w-full">
                    <TabsList>
                      <TabsTrigger value="example">Exemples</TabsTrigger>
                      <TabsTrigger value="payload">Structure des données</TabsTrigger>
                    </TabsList>
                    <TabsContent value="example" className="space-y-2">
                      <div className="bg-gray-100 p-3 rounded-md">
                        <p className="text-sm font-medium mb-2">Exemples d'URLs :</p>
                        <div className="space-y-1 text-sm font-mono">
                          <div className="flex items-center justify-between">
                            <span>https://workflow.ffnancy.fr/webhook/factures</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard('https://workflow.ffnancy.fr/webhook/factures')}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>https://api.monentreprise.com/invoices/webhook</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard('https://api.monentreprise.com/invoices/webhook')}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="payload" className="space-y-2">
                      <div className="bg-gray-100 p-3 rounded-md">
                        <p className="text-sm font-medium mb-2">Données envoyées (FormData) :</p>
                        <pre className="text-xs">
{`{
  "file": [Fichier PDF],
  "invoiceReference": "F5162713",
  "blNumber": "BL12345", 
  "supplier": "Nom Fournisseur",
  "amount": "1200.00",
  "timestamp": "2025-07-30T14:30:00Z",
  "user": "admin",
  "store": "Houdemont"
}`}
                        </pre>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="flex justify-between">
                    <Button 
                      variant="outline"
                      onClick={() => setCurrentStep(0)}
                    >
                      Retour
                    </Button>
                    <Button 
                      onClick={() => setCurrentStep(2)}
                      disabled={!webhookUrl.trim() || !webhookUrl.startsWith('http')}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Tester la connexion
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Étape 2: Test de connexion */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Test de connectivité vers : <code className="font-mono">{webhookUrl}</code>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <Button
                      onClick={() => testWebhookMutation.mutate(webhookUrl)}
                      disabled={testWebhookMutation.isPending}
                      className="w-full"
                    >
                      {testWebhookMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Test en cours...
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 mr-2" />
                          Tester la connexion
                        </>
                      )}
                    </Button>

                    {testResult && (
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            {testResult.ok ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <AlertTriangle className="w-5 h-5 text-red-600" />
                            )}
                            <span className="font-medium">
                              {testResult.ok ? 'Test réussi' : 'Test échoué'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {testResult.error ? (
                              <span>Erreur: {testResult.error}</span>
                            ) : (
                              <span>Statut HTTP: {testResult.status} {testResult.statusText}</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  <div className="flex justify-between">
                    <Button 
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                    >
                      Modifier l'URL
                    </Button>
                    <Button 
                      onClick={() => {
                        if (selectedGroupId) {
                          saveWebhookMutation.mutate({
                            groupId: selectedGroupId,
                            url: webhookUrl
                          });
                        }
                      }}
                      disabled={saveWebhookMutation.isPending || (!testResult?.ok && !testResult?.error)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {saveWebhookMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sauvegarde...
                        </>
                      ) : (
                        <>
                          Sauvegarder la configuration
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Étape 3: Finalisation */}
              {currentStep === 3 && selectedGroup && (
                <div className="space-y-6 text-center">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-green-600 mb-2">
                      Configuration terminée !
                    </h3>
                    <p className="text-gray-600">
                      Le webhook est maintenant configuré pour le magasin <strong>{selectedGroup.name}</strong>
                    </p>
                  </div>

                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Magasin:</span>
                          <span className="font-medium">{selectedGroup.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">URL:</span>
                          <span className="font-mono text-xs break-all">{webhookUrl}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Statut:</span>
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Actif
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-center space-x-4">
                    <Button 
                      variant="outline"
                      onClick={resetWizard}
                    >
                      Configurer un autre magasin
                    </Button>
                    <Button 
                      onClick={() => onOpenChange(false)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Terminer
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WebhookWizard;