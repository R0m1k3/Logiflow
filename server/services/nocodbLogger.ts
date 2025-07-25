import fs from 'fs';
import path from 'path';

export interface NocoDBLogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  operation: string;
  groupId?: number;
  groupName?: string;
  data?: any;
  error?: string;
  duration?: number;
}

class NocoDBLogger {
  private logFile: string;

  constructor() {
    // Détecter l'environnement et choisir le répertoire approprié
    let logsDir: string;
    
    // En production (Docker), utiliser /tmp qui est accessible en écriture
    if (process.env.NODE_ENV === 'production' || process.env.DOCKER_ENV) {
      logsDir = '/tmp/nocodb-logs';
    } else {
      // En développement, utiliser le répertoire courant
      logsDir = path.join(process.cwd(), 'logs');
    }
    
    try {
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      this.logFile = path.join(logsDir, 'nocodb.log');
      
      // Test d'écriture pour vérifier les permissions
      fs.writeFileSync(this.logFile, `[${new Date().toISOString()}] [INFO] [LOGGER_INIT] NocoDBLogger initialized\n`, { flag: 'a' });
      
    } catch (error) {
      // Fallback vers la console uniquement si impossible d'écrire
      console.warn('⚠️ NocoDBLogger: Impossible d\'écrire dans', logsDir, '- Mode console uniquement');
      this.logFile = '';
    }
  }

  private formatLog(entry: NocoDBLogEntry): string {
    const { timestamp, level, operation, groupId, groupName, data, error, duration } = entry;
    
    let logLine = `[${timestamp}] [${level}] [${operation}]`;
    
    if (groupId) logLine += ` [Group:${groupId}]`;
    if (groupName) logLine += ` [${groupName}]`;
    if (duration) logLine += ` [${duration}ms]`;
    
    if (data) {
      logLine += ` Data: ${JSON.stringify(data)}`;
    }
    
    if (error) {
      logLine += ` Error: ${error}`;
    }
    
    return logLine + '\n';
  }

  private writeLog(entry: NocoDBLogEntry): void {
    try {
      const logLine = this.formatLog(entry);
      
      // Écrire dans le fichier si possible
      if (this.logFile) {
        fs.appendFileSync(this.logFile, logLine);
      }
      
      // Toujours afficher en console pour développement ou si pas de fichier
      if (process.env.NODE_ENV === 'development' || !this.logFile) {
        console.log(`🗃️ [NOCODB] ${entry.operation}:`, entry.data || entry.error || 'Success');
      }
    } catch (err) {
      console.error('Erreur écriture log NocoDB:', err);
      // En cas d'erreur, au moins afficher en console
      console.log(`🗃️ [NOCODB] ${entry.operation}:`, entry.data || entry.error || 'Success');
    }
  }

  info(operation: string, data?: any, groupId?: number, groupName?: string, duration?: number): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      operation,
      groupId,
      groupName,
      data,
      duration
    });
  }

  warn(operation: string, data?: any, groupId?: number, groupName?: string): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      operation,
      groupId,
      groupName,
      data
    });
  }

  error(operation: string, error: string | Error, groupId?: number, groupName?: string, data?: any): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      operation,
      groupId,
      groupName,
      error: error instanceof Error ? error.message : error,
      data
    });
  }

  debug(operation: string, data?: any, groupId?: number, groupName?: string): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'DEBUG',
      operation,
      groupId,
      groupName,
      data
    });
  }

  // Méthode pour lire les logs récents
  getRecentLogs(lines: number = 100): string[] {
    try {
      if (!this.logFile || !fs.existsSync(this.logFile)) {
        return [`[${new Date().toISOString()}] [INFO] [LOGS_UNAVAILABLE] Logs fichier non disponible - Mode console uniquement`];
      }
      
      const content = fs.readFileSync(this.logFile, 'utf-8');
      const allLines = content.split('\n').filter(line => line.trim());
      
      return allLines.slice(-lines);
    } catch (err) {
      console.error('Erreur lecture logs NocoDB:', err);
      return [`[${new Date().toISOString()}] [ERROR] [LOGS_READ_ERROR] ${err instanceof Error ? err.message : String(err)}`];
    }
  }

  // Méthode pour nettoyer les vieux logs
  cleanOldLogs(daysToKeep: number = 7): void {
    try {
      if (!this.logFile || !fs.existsSync(this.logFile)) {
        return;
      }
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const content = fs.readFileSync(this.logFile, 'utf-8');
      const lines = content.split('\n');
      
      const filteredLines = lines.filter(line => {
        const match = line.match(/^\[([^\]]+)\]/);
        if (match) {
          const logDate = new Date(match[1]);
          return logDate >= cutoffDate;
        }
        return false;
      });
      
      fs.writeFileSync(this.logFile, filteredLines.join('\n'));
      
      this.info('LOG_CLEANUP', { 
        originalLines: lines.length, 
        filteredLines: filteredLines.length,
        daysKept: daysToKeep 
      });
    } catch (err) {
      console.error('Erreur nettoyage logs NocoDB:', err);
    }
  }
}

// Instance singleton
export const nocodbLogger = new NocoDBLogger();