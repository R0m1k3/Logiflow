import * as cron from 'node-cron';
import { BackupService } from './backupService.production.js';

export class SchedulerService {
  private static instance: SchedulerService;
  private backupService: BackupService;
  private dailyBackupTask: cron.ScheduledTask | null = null;

  private constructor() {
    this.backupService = new BackupService();
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
          'system', // créé par le système
          `Sauvegarde automatique quotidienne - ${new Date().toLocaleDateString('fr-FR')}`,
          'auto' // Type de sauvegarde automatique
        );
        
        console.log(`✅ [SCHEDULER] Sauvegarde automatique créée avec succès: ${backupId}`);
        
        // Nettoyer les anciennes sauvegardes automatiques (garder les 10 dernières)
        await this.backupService.cleanupOldBackups(10, 'auto');
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
}