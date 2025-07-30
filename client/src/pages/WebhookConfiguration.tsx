import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useAuthUnified } from "@/hooks/useAuthUnified";
import WebhookWizard from "@/components/WebhookWizard";
import { Wand2, Settings, Globe, CheckCircle, AlertTriangle, X } from "lucide-react";

interface Group {
  id: number;
  name: string;
  color: string;
  webhookUrl?: string;
}

export default function WebhookConfiguration() {
  const { user } = useAuthUnified();
  const [isWebhookWizardOpen, setIsWebhookWizardOpen] = useState(false);

  // Vérifier les permissions - seuls admin et directeur peuvent accéder
  const isAdmin = user && (user as any).role === 'admin';
  const isDirecteur = user && (user as any).role === 'directeur';
  const hasWebhookAccess = isAdmin || isDirecteur;

  // Récupérer les groupes
  const { data: groups = [], isLoading } = useQuery<Group[]>({
    queryKey: ['/api/groups'],
    enabled: !!hasWebhookAccess
  });

  if (!hasWebhookAccess) {
    return (
      <div className="p-6">
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Settings className="h-5 w-5 text-orange-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-orange-700">
                <strong>Accès restreint</strong><br />
                Seuls les administrateurs et directeurs peuvent accéder à la configuration des webhooks.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <Globe className="w-6 h-6 mr-3 text-blue-600" />
            Configuration Webhooks
          </h2>
          <p className="text-gray-600 mt-1">
            Gestion des notifications webhook pour les magasins
          </p>
        </div>
        <Button
          onClick={() => setIsWebhookWizardOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white"
          size="sm"
        >
          <Wand2 className="w-4 h-4 mr-2" />
          Assistant Webhook
        </Button>
      </div>

      {/* Statut des webhooks par magasin */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(groups as Group[]).map((group: Group) => (
          <Card key={group.id} className="border border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: group.color }}
                  />
                  {group.name}
                </CardTitle>
                <div className="flex items-center">
                  {group.webhookUrl ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      <span className="text-xs">Configuré</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-gray-400">
                      <X className="w-4 h-4 mr-1" />
                      <span className="text-xs">Non configuré</span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {group.webhookUrl ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">URL Webhook:</p>
                  <code className="text-xs bg-gray-100 p-2 rounded block break-all">
                    {group.webhookUrl}
                  </code>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Aucune URL webhook configurée pour ce magasin.
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Informations d'aide */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-lg text-blue-800 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            À propos des Webhooks
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700 space-y-2">
          <p>
            Les webhooks permettent d'envoyer automatiquement les factures vers des systèmes externes
            lorsqu'un rapprochement BL/Facture est effectué.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Chaque magasin peut avoir sa propre URL webhook</li>
            <li>Les factures sont envoyées en POST avec les métadonnées et le fichier PDF</li>
            <li>L'Assistant Webhook permet de configurer et tester les connexions</li>
            <li>Seuls les administrateurs et directeurs peuvent configurer les webhooks</li>
          </ul>
        </CardContent>
      </Card>

      {/* Assistant Webhook Configuration */}
      <WebhookWizard 
        open={isWebhookWizardOpen}
        onOpenChange={setIsWebhookWizardOpen}
      />
    </div>
  );
}