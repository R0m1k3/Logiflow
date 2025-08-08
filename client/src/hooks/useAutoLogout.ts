import { useEffect, useRef } from 'react';
import { useAuthUnified } from './useAuthUnified';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from './use-toast';

// 20 minutes en millisecondes
const INACTIVITY_TIMEOUT = 20 * 60 * 1000;

// Événements qui indiquent une activité utilisateur
const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keypress',
  'scroll',
  'touchstart',
  'click',
] as const;

export function useAutoLogout() {
  const { user, isAuthenticated } = useAuthUnified();
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAdminRef = useRef(false);
  
  // Mettre à jour la référence admin quand l'utilisateur change
  useEffect(() => {
    isAdminRef.current = (user as any)?.role === 'admin';
  }, [(user as any)?.role]);

  const clearTimers = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
  };

  const performLogout = async () => {
    console.log('🔒 Déconnexion automatique après inactivité');
    
    try {
      await apiRequest('/api/logout', 'POST');
      
      // Afficher une notification
      toast({
        title: "Session expirée",
        description: "Vous avez été déconnecté après 20 minutes d'inactivité",
        variant: "destructive",
      });
      
      // Rediriger vers la page d'authentification
      setTimeout(() => {
        window.location.href = '/auth';
      }, 2000);
      
    } catch (error) {
      console.error('Erreur lors de la déconnexion automatique:', error);
      // En cas d'erreur, rediriger quand même
      window.location.href = '/auth';
    }
  };

  const showWarning = () => {
    toast({
      title: "Session bientôt expirée",
      description: "Votre session expirera dans 2 minutes. Bougez la souris pour la maintenir active.",
      variant: "destructive",
    });
  };

  const resetTimer = () => {
    // Ne pas démarrer de timer pour les admin
    if (isAdminRef.current || !isAuthenticated) {
      clearTimers();
      return;
    }

    clearTimers();
    
    // Avertissement 2 minutes avant déconnexion (18 minutes après inactivité)
    warningTimeoutRef.current = setTimeout(() => {
      showWarning();
    }, INACTIVITY_TIMEOUT - 2 * 60 * 1000);
    
    // Déconnexion après 20 minutes
    timeoutRef.current = setTimeout(() => {
      performLogout();
    }, INACTIVITY_TIMEOUT);
  };

  useEffect(() => {
    // Ne pas activer pour les admin ou utilisateurs non connectés
    if (!isAuthenticated || (user as any)?.role === 'admin') {
      clearTimers();
      return;
    }

    // Démarrer le timer initial
    resetTimer();

    // Écouter les événements d'activité utilisateur
    const handleActivity = () => {
      resetTimer();
    };

    // Ajouter les event listeners
    ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Cleanup
    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [isAuthenticated, (user as any)?.role]);

  // Cleanup au démontage
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  // Retourner des informations de debug si nécessaire
  return {
    isActive: !!timeoutRef.current,
    isAdmin: (user as any)?.role === 'admin',
    remainingTime: timeoutRef.current ? INACTIVITY_TIMEOUT : 0,
  };
}