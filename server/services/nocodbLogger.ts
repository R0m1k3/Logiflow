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
    // Créer le répertoire de logs s'il n'existe pas
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    this.logFile = path.join(logsDir, 'nocodb.log');
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
      fs.appendFileSync(this.logFile, logLine);
      
      // Console log pour développement
      if (process.env.NODE_ENV === 'development') {
        console.log(`🗃️ [NOCODB] ${entry.operation}:`, entry.data || entry.error || 'Success');
      }
    } catch (err) {
      console.error('Erreur écriture log NocoDB:', err);
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
      if (!fs.existsSync(this.logFile)) {
        return [];
      }
      
      const content = fs.readFileSync(this.logFile, 'utf-8');
      const allLines = content.split('\n').filter(line => line.trim());
      
      return allLines.slice(-lines);
    } catch (err) {
      console.error('Erreur lecture logs NocoDB:', err);
      return [];
    }
  }

  // Méthode pour nettoyer les vieux logs
  cleanOldLogs(daysToKeep: number = 7): void {
    try {
      if (!fs.existsSync(this.logFile)) {
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