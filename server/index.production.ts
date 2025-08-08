import express, { type Request, Response, NextFunction } from "express";
import { setupSecurityHeaders, setupRateLimiting, setupInputSanitization } from "./security";
import { setupCompression } from "./cache";
import { monitor, setupMonitoringEndpoints } from "./monitoring";
import { initDatabase } from "./initDatabase.production";
import path from "path";
import fs from "fs";

const app = express();

// Configuration trust proxy sécurisée pour Docker
// Faire confiance seulement au premier proxy (Docker/nginx)
app.set('trust proxy', 1);

// Fonction de log pour la production
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Fonction pour servir les fichiers statiques en production
function serveStatic(app: express.Express) {
  // Essayer plusieurs chemins possibles pour le build frontend
  const possiblePaths = [
    path.resolve("dist", "public"),
    path.resolve("dist"),
    path.resolve(".", "dist", "public"),
  ];
  
  let distPath = null;
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath) && fs.existsSync(path.join(testPath, "index.html"))) {
      distPath = testPath;
      break;
    }
  }

  if (!distPath) {
    console.log("Available directories:");
    console.log("- dist/:", fs.existsSync("dist") ? fs.readdirSync("dist") : "NOT FOUND");
    console.log("- dist/public/:", fs.existsSync("dist/public") ? fs.readdirSync("dist/public") : "NOT FOUND");
    
    throw new Error(
      `Could not find the build directory with index.html. Checked: ${possiblePaths.join(", ")}`,
    );
  }

  console.log(`✅ Serving static files from: ${distPath}`);
  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist (seulement pour les routes non-API)
  app.get("*", (req, res) => {
    // Ne pas rediriger les routes API vers index.html
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: 'API route not found' });
    }
    
    // Log pour debug du routing
    console.log(`📍 Serving index.html for path: ${req.path}`);
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

// Sécurité et optimisation
setupSecurityHeaders(app);
setupRateLimiting(app);
setupInputSanitization(app);
setupCompression(app);

// Monitoring des performances
app.use(monitor.middleware());
setupMonitoringEndpoints(app);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Logging optimisé (sans détails de réponse sensibles)
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      // Logging sécurisé sans données sensibles
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      // Ne pas logger les données sensibles
      if (path.includes('/login') || path.includes('/password')) {
        logLine += ' :: [SENSITIVE DATA HIDDEN]';
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialiser la base de données en premier
  try {
    console.log('🔄 SERVER STARTUP: Initializing database...');
    console.log('📋 SERVER STARTUP: Dashboard messages migration should be included in database initialization');
    await initDatabase();
    console.log('✅ SERVER STARTUP: Database initialization completed successfully');
    
    // Run SAV tables migration
    console.log('🔄 SERVER STARTUP: Running SAV tables migration...');
    const { migrateSavTables } = await import('./initDatabase.production');
    await migrateSavTables();
    console.log('✅ SERVER STARTUP: SAV tables migration completed');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  }

  // MIGRATIONS DISABLED: Supprimé pour éviter les exécutions répétées à chaque mise à jour
  console.log('⚠️ MIGRATIONS DISABLED: Automatic migrations completely disabled to prevent repeated execution');

  const { registerRoutes } = await import('./routes.production');
  const server = await registerRoutes(app);

  // Initialiser et démarrer les tâches programmées (sauvegarde et rapprochement BL)
  try {
    const { SchedulerService } = await import('./schedulerService.production.js');
    const scheduler = SchedulerService.getInstance();
    
    // Démarrer les tâches automatiques si elles sont activées
    // Note: Les tâches seront activées/désactivées via l'API selon les préférences utilisateur
    console.log('🚀 Services programmés initialisés et prêts à être activés');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des services programmés:', error);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // En production, servir les fichiers statiques uniquement
  serveStatic(app);

  // Port configuré pour la production
  const port = process.env.PORT || 3000;
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`Server running on port ${port}`);
  });
})();
