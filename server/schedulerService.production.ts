import * as cron from 'node-cron';
import { BackupService } from './backupService.production.js';
import { Pool } from 'pg';
import { performBLReconciliation } from './blReconciliationService.js';

export class SchedulerService {
  private static instance: SchedulerService;
  private backupService: BackupService;
  private dailyBackupTask: cron.ScheduledTask | null = null;
  private blReconciliationTask: cron.ScheduledTask | null = null;

  private constructor() {
    // Créer un pool directement
    const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
      max: 5,
      min: 1,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 20000
    });
    this.backupService = new BackupService(pool);
  }

  public static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  /**
   * Démarre la sauvegarde automatique quotidienne à minuit
   */
  public startDailyBackup(): void {
    // Arrêter la tâche existante si elle existe
    if (this.dailyBackupTask) {
      this.dailyBackupTask.stop();
      this.dailyBackupTask.destroy();
    }

    // Programmer une sauvegarde tous les jours à minuit (00:00)
    // Format cron: seconde minute heure jour mois jour_semaine
    this.dailyBackupTask = cron.schedule('0 0 * * *', async () => {
      try {
        console.log('🌙 [SCHEDULER] Démarrage de la sauvegarde automatique quotidienne...');
        
        const backupId = await this.backupService.createBackup(
          '1', // créé par l'admin (ID 1)
          `Sauvegarde automatique quotidienne - ${new Date().toLocaleDateString('fr-FR')}`,
          'auto' // Type de sauvegarde automatique
        );
        
        console.log(`✅ [SCHEDULER] Sauvegarde automatique créée avec succès: ${backupId}`);
        
        // Nettoyer les anciennes sauvegardes automatiques (garder les 5 dernières)
        await this.backupService.cleanupOldBackups(5, 'auto');
        console.log('🧹 [SCHEDULER] Nettoyage des anciennes sauvegardes automatiques terminé');
        
      } catch (error) {
        console.error('❌ [SCHEDULER] Erreur lors de la sauvegarde automatique:', error);
      }
    });

    console.log('⏰ [SCHEDULER] Sauvegarde automatique quotidienne programmée à minuit (Europe/Paris)');
  }

  /**
   * Arrête la sauvegarde automatique
   */
  public stopDailyBackup(): void {
    if (this.dailyBackupTask) {
      this.dailyBackupTask.stop();
      this.dailyBackupTask.destroy();
      this.dailyBackupTask = null;
      console.log('⏹️ [SCHEDULER] Sauvegarde automatique quotidienne arrêtée');
    }
  }

  /**
   * Vérifie le statut de la sauvegarde automatique
   */
  public getDailyBackupStatus(): { active: boolean; nextRun?: string } {
    if (!this.dailyBackupTask) {
      return { active: false };
    }

    // Calculer la prochaine exécution (minuit suivant)
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0); // Minuit suivant
    
    return {
      active: true,
      nextRun: nextMidnight.toLocaleString('fr-FR', { 
        timeZone: 'Europe/Paris',
        dateStyle: 'full',
        timeStyle: 'short'
      })
    };
  }

  /**
   * Force une sauvegarde immédiate (pour test)
   */
  public async triggerManualBackup(): Promise<string> {
    console.log('🔧 [SCHEDULER] Déclenchement manuel de sauvegarde...');
    const backupId = await this.backupService.createBackup(
      'system',
      `Sauvegarde manuelle déclenchée - ${new Date().toLocaleString('fr-FR')}`,
      'manual'
    );
    console.log(`✅ [SCHEDULER] Sauvegarde manuelle créée: ${backupId}`);
    return backupId;
  }

  /**
   * Démarre le rapprochement automatique par N° BL toutes les 20 minutes
   */
  public startBLReconciliation(): void {
    // Arrêter la tâche existante si elle existe
    if (this.blReconciliationTask) {
      this.blReconciliationTask.stop();
      this.blReconciliationTask.destroy();
    }

    // Programmer un rapprochement toutes les 20 minutes
    // Format cron: */20 * * * * = toutes les 20 minutes
    this.blReconciliationTask = cron.schedule('*/20 * * * *', async () => {
      try {
        console.log('⏰ [BL-RECONCILIATION] Démarrage du rapprochement automatique programmé');
        
        const result = await performBLReconciliation();
        
        if (result.reconciledDeliveries > 0) {
          console.log(`🎉 [BL-RECONCILIATION] ${result.reconciledDeliveries} nouvelles livraisons rapprochées automatiquement`);
        } else {
          console.log('ℹ️ [BL-RECONCILIATION] Aucune nouvelle livraison à rapprocher');
        }
        
        if (result.errors.length > 0) {
          console.error(`⚠️ [BL-RECONCILIATION] ${result.errors.length} erreurs lors du rapprochement automatique:`, result.errors);
        }
      } catch (error) {
        console.error('💥 [BL-RECONCILIATION] Erreur lors du rapprochement automatique:', error);
      }
    });

    console.log('⏰ [BL-RECONCILIATION] Rapprochement automatique par N° BL programmé toutes les 20 minutes');
  }

  /**
   * Arrête le rapprochement automatique
   */
  public stopBLReconciliation(): void {
    if (this.blReconciliationTask) {
      this.blReconciliationTask.stop();
      this.blReconciliationTask.destroy();
      this.blReconciliationTask = null;
      console.log('⏹️ [BL-RECONCILIATION] Rapprochement automatique arrêté');
    }
  }

  /**
   * Vérifie le statut du rapprochement automatique
   */
  public getBLReconciliationStatus(): { active: boolean; nextRun?: string; intervalMinutes: number } {
    if (!this.blReconciliationTask) {
      return { active: false, intervalMinutes: 20 };
    }

    // Calculer la prochaine exécution (dans maximum 20 minutes)
    const now = new Date();
    const nextRun = new Date(now.getTime() + (20 * 60 * 1000)); // +20 minutes max
    
    return {
      active: true,
      intervalMinutes: 20,
      nextRun: nextRun.toLocaleString('fr-FR', { 
        timeZone: 'Europe/Paris',
        dateStyle: 'short',
        timeStyle: 'short'
      })
    };
  }

  /**
   * Force un rapprochement immédiat (pour test)
   */
  public async triggerManualBLReconciliation(): Promise<any> {
    console.log('🔧 [BL-RECONCILIATION] Déclenchement manuel du rapprochement...');
    const result = await performBLReconciliation();
    console.log(`✅ [BL-RECONCILIATION] Rapprochement manuel terminé: ${result.reconciledDeliveries}/${result.processedDeliveries} livraisons rapprochées`);
    return result;
  }

  /**
   * Démarre tous les services programmés (pour l'initialisation)
   */
  public startAllServices(): void {
    this.startDailyBackup();
    this.startBLReconciliation();
    console.log('🚀 [SCHEDULER] Tous les services automatiques démarrés');
  }

  /**
   * Arrête tous les services programmés
   */
  public stopAllServices(): void {
    this.stopDailyBackup();
    this.stopBLReconciliation();
    console.log('⏹️ [SCHEDULER] Tous les services automatiques arrêtés');
  }

  /**
   * Obtient le statut complet de tous les services
   */
  public getAllServicesStatus(): {
    dailyBackup: { active: boolean; nextRun?: string };
    blReconciliation: { active: boolean; nextRun?: string; intervalMinutes: number };
  } {
    return {
      dailyBackup: this.getDailyBackupStatus(),
      blReconciliation: this.getBLReconciliationStatus()
    };
  }
}