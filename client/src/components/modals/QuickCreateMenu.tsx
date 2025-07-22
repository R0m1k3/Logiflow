import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Package, Truck } from "lucide-react";
import { useAuthUnified } from "@/hooks/useAuthUnified";
import { usePermissions } from "@/hooks/usePermissions";

interface QuickCreateMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateOrder: () => void;
  onCreateDelivery: () => void;
}

export default function QuickCreateMenu({
  isOpen,
  onClose,
  onCreateOrder,
  onCreateDelivery,
}: QuickCreateMenuProps) {
  const { user } = useAuthUnified();
  const { hasPermission } = usePermissions();
  
  // 🔧 FIX TOUS RÔLES - Pour tous les rôles, autoriser création selon spécifications
  const isAdmin = user && (user as any).role === 'admin';
  const isManager = user && (user as any).role === 'manager';
  const isEmployee = user && (user as any).role === 'employee';
  const isDirecteur = user && (user as any).role === 'directeur';
  
  // Spécifications MISES À JOUR: Manager PEUT créer des commandes ET des livraisons
  const ordersAllowed = isAdmin || isDirecteur || isManager || hasPermission('orders_create');
  const deliveriesAllowed = isAdmin || isManager || isDirecteur || hasPermission('deliveries_create');



  // Si aucune permission de création, ne pas afficher le modal
  if (!ordersAllowed && !deliveriesAllowed) {
    console.log('❌ No creation permissions, hiding modal');
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" aria-describedby="quick-create-modal-description">
        <DialogHeader>
          <DialogTitle>Création rapide</DialogTitle>
          <p id="quick-create-modal-description" className="text-sm text-gray-600 mt-1">
            Choisir le type d'élément à créer
          </p>
        </DialogHeader>
        <div className="space-y-3">
          {ordersAllowed && (
            <Button
              variant="outline"
              className="w-full justify-start space-x-3 p-4 h-auto hover:bg-blue-50 hover:border-blue-300"
              onClick={onCreateOrder}
            >
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Nouvelle Commande</p>
                <p className="text-sm text-gray-600">Créer une commande fournisseur</p>
              </div>
            </Button>
          )}
          
          {deliveriesAllowed && (
            <Button
              variant="outline"
              className="w-full justify-start space-x-3 p-4 h-auto hover:bg-green-50 hover:border-green-300"
              onClick={onCreateDelivery}
            >
              <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Nouvelle Livraison</p>
                <p className="text-sm text-gray-600">Planifier une livraison</p>
              </div>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
