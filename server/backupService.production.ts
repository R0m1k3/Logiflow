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
    // Utiliser /tmp pour les sauvegardes en production (accessible en écriture)
    this.backupDir = process.env.NODE_ENV === 'production' ? '/tmp/logiflow-backups' : path.join(process.cwd(), 'backups');
    this.ensureBackupDirectory();
  }

  private ensureBackupDirectory() {
    try {
      if (!fs.existsSync(this.backupDir)) {
        fs.mkdirSync(this.backupDir, { recursive: true });
        console.log(`✅ Backup directory created: ${this.backupDir}`);
      }
    } catch (error) {
      console.error(`❌ Failed to create backup directory: ${this.backupDir}`, error);
      // Fallback vers /tmp si le répertoire principal échoue
      if (this.backupDir !== '/tmp/logiflow-backups-fallback') {
        this.backupDir = '/tmp/logiflow-backups-fallback';
        try {
          if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
            console.log(`✅ Fallback backup directory created: ${this.backupDir}`);
          }
        } catch (fallbackError) {
          console.error('❌ Failed to create fallback backup directory:', fallbackError);
          throw new Error('Cannot create backup directory. Check filesystem permissions.');
        }
      }
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
      console.log(`🔧 Backup filepath: ${filepath}`);

      // Construire la commande pg_dump
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL not found');
      }
      console.log(`🔗 Database URL available: ${dbUrl.substring(0, 20)}...`);

      // Extraire les informations de connexion de l'URL
      const url = new URL(dbUrl);
      const dbName = url.pathname.slice(1);
      const host = url.hostname;
      const port = url.port || '5432';
      const username = url.username;
      const password = url.password;

      console.log(`📋 Connection details: host=${host}, port=${port}, db=${dbName}, user=${username}`);

      console.log(`🗃️ Running pg_dump for backup: ${backupId}`);
      
      // Forcer l'utilisation de PostgreSQL 16.3 pour compatibilité avec Neon 16.9
      let pgDumpPath = '/nix/store/yz718sizpgsnq2y8gfv8bba8l8r4494l-postgresql-16.3/bin/pg_dump';
      console.log('🎯 Using PostgreSQL 16.3 for Neon compatibility');
      
      try {
        await execAsync(`test -x ${pgDumpPath}`);
        console.log('✅ pg_dump 16.3 found at:', pgDumpPath);
      } catch (error) {
        console.log('⚠️ PostgreSQL 16.3 not found, trying to find any version 16...');
        // Utiliser directement PostgreSQL 16 trouvé
        const commonPaths = [
          '/nix/store/yz718sizpgsnq2y8gfv8bba8l8r4494l-postgresql-16.3/bin/pg_dump',
          '/nix/store/r8ivqqhsp8v042nhw5sap9kz2g6ar4v1-postgresql-16.9/bin/pg_dump',
          '/usr/bin/pg_dump',
          '/usr/local/bin/pg_dump'
        ];
        
        let found = false;
        for (const path of commonPaths) {
          try {
            try {
              await execAsync(`test -x ${path}`);
              pgDumpPath = path;
              found = true;
              console.log('✅ pg_dump found at:', pgDumpPath);
              break;
            } catch (e) {
              // Si le chemin exact échoue, essayer de le trouver dynamiquement
              if (path.includes('nix/store')) {
                try {
                  const findResult = await execAsync('find /nix/store -name pg_dump -executable 2>/dev/null | head -1');
                  if (findResult.stdout.trim()) {
                    pgDumpPath = findResult.stdout.trim();
                    found = true;
                    console.log('✅ pg_dump found dynamically at:', pgDumpPath);
                    break;
                  }
                } catch (findError) {
                  continue;
                }
              }
            }
          } catch (e) {
            continue;
          }
        }
        
        if (!found) {
          console.error('❌ pg_dump not found in any common location');
          throw new Error('pg_dump not available - PostgreSQL client tools required. Please install postgresql package.');
        }
      }
      
      // Commande pg_dump avec le chemin complet
      const dumpCommand = `"${pgDumpPath}" "${dbUrl}" --verbose --clean --if-exists --create --format=plain --file="${filepath}"`;

      console.log(`🔧 Final command: ${pgDumpPath} [URL] --verbose --clean --if-exists --create --format=plain --file="${filepath}"`);
      
      console.log('🚀 Executing pg_dump...');
      const result = await execAsync(dumpCommand, { timeout: 300000 }); // 5 minutes timeout
      console.log('✅ pg_dump completed successfully');
      
      if (result.stderr && result.stderr.includes('ERROR')) {
        console.error('⚠️ pg_dump stderr:', result.stderr);
      }

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
    return this.getBackupFilePath(backupId);
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

  // Méthode pour obtenir un backup spécifique
  async getBackup(backupId: string): Promise<BackupRecord | null> {
    try {
      const result = await this.pool.query(`
        SELECT * FROM database_backups WHERE id = $1
      `, [backupId]);

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error getting backup:', error);
      return null;
    }
  }

  // Méthode pour obtenir le chemin du fichier de sauvegarde
  async getBackupFilePath(backupId: string): Promise<string | null> {
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
      console.error('Error getting backup file path:', error);
      return null;
    }
  }

  // Méthode pour restaurer depuis un fichier uploadé
  async restoreFromFile(filePath: string): Promise<boolean> {
    return this.restoreFromUpload(filePath);
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