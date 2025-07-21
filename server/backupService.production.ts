import { Pool } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface BackupRecord {
  id: string;
  filename: string;
  description: string;
  size: number;
  created_at: string;
  created_by: string;
  tables_count: number;
  status: 'creating' | 'completed' | 'failed';
}

export class BackupService {
  private pool: Pool;
  private backupDir: string;

  constructor(pool: Pool) {
    this.pool = pool;
    this.backupDir = path.join(process.cwd(), 'backups');
    this.ensureBackupDirectory();
  }

  private ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async initBackupTable() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS database_backups (
        id VARCHAR(255) PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        description TEXT,
        size BIGINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(255) NOT NULL,
        tables_count INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'creating'
      )
    `);
  }

  async getBackups(): Promise<BackupRecord[]> {
    try {
      const result = await this.pool.query(`
        SELECT * FROM database_backups 
        ORDER BY created_at DESC 
        LIMIT 10
      `);
      return result.rows;
    } catch (error) {
      console.error('Error fetching backups:', error);
      return [];
    }
  }

  async createBackup(description: string, createdBy: string): Promise<string> {
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const filename = `${backupId}.sql`;
    const filepath = path.join(this.backupDir, filename);

    try {
      // Créer l'enregistrement de sauvegarde
      await this.pool.query(`
        INSERT INTO database_backups (id, filename, description, created_by, status)
        VALUES ($1, $2, $3, $4, 'creating')
      `, [backupId, filename, description, createdBy]);

      // Lancer la sauvegarde en arrière-plan
      this.performBackup(backupId, filepath, description, createdBy);

      return backupId;
    } catch (error) {
      console.error('Error creating backup record:', error);
      throw error;
    }
  }

  private async performBackup(backupId: string, filepath: string, description: string, createdBy: string) {
    try {
      console.log(`🔄 Starting backup creation: ${backupId}`);

      // Construire la commande pg_dump
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL not found');
      }

      // Extraire les informations de connexion de l'URL
      const url = new URL(dbUrl);
      const dbName = url.pathname.slice(1);
      const host = url.hostname;
      const port = url.port || '5432';
      const username = url.username;
      const password = url.password;

      // Commande pg_dump complète
      const dumpCommand = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${username} -d ${dbName} --verbose --clean --if-exists --create --format=plain > "${filepath}"`;

      console.log(`🗃️ Running pg_dump for backup: ${backupId}`);
      await execAsync(dumpCommand);

      // Vérifier que le fichier existe et calculer sa taille
      const stats = fs.statSync(filepath);
      const fileSize = stats.size;

      // Compter le nombre de tables dans la sauvegarde
      const tablesCount = await this.countTablesInDatabase();

      // Mettre à jour l'enregistrement
      await this.pool.query(`
        UPDATE database_backups 
        SET size = $1, tables_count = $2, status = 'completed'
        WHERE id = $3
      `, [fileSize, tablesCount, backupId]);

      console.log(`✅ Backup completed successfully: ${backupId} (${fileSize} bytes, ${tablesCount} tables)`);

      // Nettoyer les ancienne sauvegardes (garder seulement 10)
      await this.cleanOldBackups();

    } catch (error) {
      console.error(`❌ Backup failed: ${backupId}`, error);
      
      // Marquer comme échoué
      await this.pool.query(`
        UPDATE database_backups 
        SET status = 'failed'
        WHERE id = $1
      `, [backupId]);

      // Supprimer le fichier partiel s'il existe
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }
  }

  private async countTablesInDatabase(): Promise<number> {
    try {
      const result = await this.pool.query(`
        SELECT COUNT(*) as count
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      `);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error counting tables:', error);
      return 0;
    }
  }

  async getBackupFile(backupId: string): Promise<string | null> {
    try {
      const result = await this.pool.query(`
        SELECT filename, status FROM database_backups 
        WHERE id = $1 AND status = 'completed'
      `, [backupId]);

      if (result.rows.length === 0) {
        return null;
      }

      const filepath = path.join(this.backupDir, result.rows[0].filename);
      
      if (!fs.existsSync(filepath)) {
        return null;
      }

      return filepath;
    } catch (error) {
      console.error('Error getting backup file:', error);
      return null;
    }
  }

  async deleteBackup(backupId: string): Promise<boolean> {
    try {
      // Récupérer les informations du fichier
      const result = await this.pool.query(`
        SELECT filename FROM database_backups WHERE id = $1
      `, [backupId]);

      if (result.rows.length === 0) {
        return false;
      }

      const filename = result.rows[0].filename;
      const filepath = path.join(this.backupDir, filename);

      // Supprimer le fichier physique
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }

      // Supprimer l'enregistrement
      await this.pool.query(`
        DELETE FROM database_backups WHERE id = $1
      `, [backupId]);

      console.log(`🗑️ Backup deleted successfully: ${backupId}`);
      return true;
    } catch (error) {
      console.error('Error deleting backup:', error);
      return false;
    }
  }

  async restoreBackup(backupId: string): Promise<boolean> {
    try {
      const filepath = await this.getBackupFile(backupId);
      if (!filepath) {
        throw new Error('Backup file not found');
      }

      console.log(`🔄 Starting database restore from: ${backupId}`);

      // Construire la commande psql pour restaurer
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL not found');
      }

      const url = new URL(dbUrl);
      const dbName = url.pathname.slice(1);
      const host = url.hostname;
      const port = url.port || '5432';
      const username = url.username;
      const password = url.password;

      // Commande de restauration
      const restoreCommand = `PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${username} -d ${dbName} -v ON_ERROR_STOP=1 < "${filepath}"`;

      await execAsync(restoreCommand);

      console.log(`✅ Database restored successfully from: ${backupId}`);
      return true;
    } catch (error) {
      console.error('Error restoring backup:', error);
      return false;
    }
  }

  async restoreFromUpload(uploadPath: string): Promise<boolean> {
    try {
      console.log(`🔄 Starting database restore from upload: ${uploadPath}`);

      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL not found');
      }

      const url = new URL(dbUrl);
      const dbName = url.pathname.slice(1);
      const host = url.hostname;
      const port = url.port || '5432';
      const username = url.username;
      const password = url.password;

      // Commande de restauration
      const restoreCommand = `PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${username} -d ${dbName} -v ON_ERROR_STOP=1 < "${uploadPath}"`;

      await execAsync(restoreCommand);

      // Supprimer le fichier temporaire
      if (fs.existsSync(uploadPath)) {
        fs.unlinkSync(uploadPath);
      }

      console.log(`✅ Database restored successfully from upload`);
      return true;
    } catch (error) {
      console.error('Error restoring from upload:', error);
      // Supprimer le fichier temporaire même en cas d'erreur
      if (fs.existsSync(uploadPath)) {
        fs.unlinkSync(uploadPath);
      }
      return false;
    }
  }

  private async cleanOldBackups() {
    try {
      // Récupérer toutes les sauvegardes triées par date
      const result = await this.pool.query(`
        SELECT id, filename FROM database_backups 
        ORDER BY created_at DESC
      `);

      // Garder seulement les 10 plus récentes
      const toDelete = result.rows.slice(10);

      for (const backup of toDelete) {
        await this.deleteBackup(backup.id);
      }

      if (toDelete.length > 0) {
        console.log(`🧹 Cleaned ${toDelete.length} old backups`);
      }
    } catch (error) {
      console.error('Error cleaning old backups:', error);
    }
  }
}