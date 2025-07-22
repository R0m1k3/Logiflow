// Utilitaire pour harmoniser les couleurs des rôles dans toute l'application
import { Crown, Users, User, Shield } from "lucide-react";

export const ROLE_COLORS = {
  admin: '#fca5a5',        // Rouge très clair (Administrateur)
  manager: '#93c5fd',      // Bleu très clair (Manager)
  employee: '#86efac',     // Vert très clair (Employé)
  directeur: '#c4b5fd',    // Violet très clair (Directeur)
} as const;

export const ROLE_DISPLAY_NAMES = {
  admin: 'Administrateur',
  manager: 'Manager',
  employee: 'Employé',
  directeur: 'Directeur',
} as const;

export const ROLE_ICONS = {
  admin: Crown,
  manager: Users,
  employee: User,
  directeur: Shield,
} as const;

export type RoleType = keyof typeof ROLE_COLORS;

export function getRoleColor(roleName: string): string {
  const roleKey = roleName.toLowerCase() as RoleType;
  return ROLE_COLORS[roleKey] || '#666666';
}

export function getRoleDisplayName(roleName: string): string {
  const roleKey = roleName.toLowerCase() as RoleType;
  return ROLE_DISPLAY_NAMES[roleKey] || roleName;
}

export function getRoleIcon(roleName: string) {
  const roleKey = roleName.toLowerCase() as RoleType;
  return ROLE_ICONS[roleKey] || User;
}

// Utilitaire pour les classes Tailwind (pour Users.tsx) - couleurs très claires et douces
export function getRoleTailwindClasses(roleName: string) {
  switch (roleName.toLowerCase()) {
    case 'admin':
      return {
        badgeClass: 'bg-red-50 text-red-600 border border-red-100',
        iconClass: 'text-red-400',
        bgColor: '#fef2f2',
        textColor: '#dc2626',
        borderColor: '#fecaca'
      };
    case 'manager':
      return {
        badgeClass: 'bg-blue-50 text-blue-600 border border-blue-100',
        iconClass: 'text-blue-400',
        bgColor: '#eff6ff',
        textColor: '#2563eb',
        borderColor: '#dbeafe'
      };
    case 'employee':
      return {
        badgeClass: 'bg-green-50 text-green-600 border border-green-100',
        iconClass: 'text-green-400',
        bgColor: '#f0fdf4',
        textColor: '#16a34a',
        borderColor: '#dcfce7'
      };
    case 'directeur':
      return {
        badgeClass: 'bg-purple-50 text-purple-600 border border-purple-100',
        iconClass: 'text-purple-400',
        bgColor: '#faf5ff',
        textColor: '#9333ea',
        borderColor: '#e9d5ff'
      };
    default:
      return {
        badgeClass: 'bg-gray-50 text-gray-600 border border-gray-100',
        iconClass: 'text-gray-400',
        bgColor: '#f9fafb',
        textColor: '#4b5563',
        borderColor: '#e5e7eb'
      };
  }
}