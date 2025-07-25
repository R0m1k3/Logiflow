// Environment setup for production deployment
// Auto-detect environment based on Docker/container deployment
console.log('🔍 DIAGNOSTIC - NODE_ENV:', process.env.NODE_ENV);
console.log('🔍 DIAGNOSTIC - DOCKER_ENV:', process.env.DOCKER_ENV);
console.log('🔍 DIAGNOSTIC - PWD:', process.cwd());
console.log('🔍 DIAGNOSTIC - __dirname:', import.meta.dirname);

// Enhanced environment detection
const isDocker = process.cwd() === '/app' || process.env.DOCKER_ENV === 'production';
const isReplit = process.cwd().includes('/home/runner/workspace');
const isProduction = process.env.NODE_ENV === 'production' || isDocker;

console.log('🔍 Environment Analysis:', {
  cwd: process.cwd(),
  isDocker,
  isReplit,
  isProduction,
  nodeEnv: process.env.NODE_ENV,
  dockerEnv: process.env.DOCKER_ENV
});

if (isDocker) {
  console.log('🐳 Detected Docker production environment - switching to production mode');
  process.env.NODE_ENV = 'production';
  process.env.STORAGE_MODE = 'production';
} else if (isReplit) {
  console.log('🔧 Detected Replit development environment');
  process.env.NODE_ENV = 'development';
  process.env.STORAGE_MODE = 'production'; // Keep production storage but dev Vite
} else if (isProduction) {
  console.log('🏭 Production mode detected');
  process.env.STORAGE_MODE = 'production';
} else {
  console.log('🔧 Development mode');
}

console.log('🔍 DIAGNOSTIC - Final STORAGE_MODE:', process.env.STORAGE_MODE);
console.log('🔍 DIAGNOSTIC - Using storage:', process.env.STORAGE_MODE === 'production' ? 'PRODUCTION' : 'DEVELOPMENT');

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupSecurityHeaders, setupRateLimiting, setupInputSanitization } from "./security";
import { setupCompression } from "./cache";
import { monitor, setupMonitoringEndpoints } from "./monitoring";
import { initRolesAndPermissions } from "./initRolesAndPermissions";
import { initDatabase } from "./initDatabase.production";

const app = express();

// Sécurité et optimisation
setupSecurityHeaders(app);
setupRateLimiting(app);
setupInputSanitization(app);
setupCompression(app);

// Monitoring des performances
app.use(monitor.middleware());
setupMonitoringEndpoints(app);

// Configure trust proxy for Replit environment  
app.set('trust proxy', 1);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

(async () => {
  // Conditional imports based on environment
  let setupVite: any, serveStatic: any, log: any;

  // For Docker environments, route to production index.ts if available
  if (isDocker) {
    console.log('🐳 Docker environment detected - delegating to production entry point');
    try {
      const productionModule = await import("./index.production.ts");
      console.log('✅ Successfully loaded production module, stopping execution here');
      return; // Exit early since production module will handle everything
    } catch (error) {
      console.warn('⚠️  Production module not available, continuing with current process:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  if (process.env.NODE_ENV === "production" || process.env.DOCKER_ENV === "production") {
    const viteProduction = await import("./vite.production.ts");
    setupVite = viteProduction.setupVite;
    serveStatic = viteProduction.serveStatic;
    log = viteProduction.log;
  } else {
    try {
      const viteDev = await import("./vite.ts");
      setupVite = viteDev.setupVite;
      serveStatic = viteDev.serveStatic;
      log = viteDev.log;
    } catch (error) {
      console.error("❌ Failed to import vite.ts, falling back to production mode:", error instanceof Error ? error.message : 'Unknown error');
      // Fallback to production vite if development vite fails
      const viteProduction = await import("./vite.production.ts");
      setupVite = viteProduction.setupVite;
      serveStatic = viteProduction.serveStatic;
      log = viteProduction.log;
    }
  }

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

  // Initialize roles and permissions on startup
  try {
    await initRolesAndPermissions();
  } catch (error) {
    console.error("Failed to initialize roles and permissions:", error);
    // Continue startup even if role initialization fails
  }

  // Initialize production database and permissions when using production storage
  if (process.env.STORAGE_MODE === 'production') {
    try {
      await initDatabase();
      // CRITICAL FIX: Auto-fix employee permissions on every startup
      const { ensureEmployeePermissions } = await import('./initDatabase.production');
      await ensureEmployeePermissions();
      
      // Initialize all automatic services (backup and BL reconciliation)
      const { SchedulerService } = await import('./schedulerService.production.js');
      const scheduler = SchedulerService.getInstance();
      scheduler.startAllServices();
    } catch (error) {
      console.error("Failed to initialize production database:", error);
      // Continue startup even if production initialization fails
    }
  }

  // Health check endpoint for Docker
  app.get('/api/health', (req, res) => {
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      storageMode: process.env.STORAGE_MODE || 'development'
    });
  });

  // Setup routes - use appropriate routes based on storage mode
  let server;
  if (process.env.STORAGE_MODE === 'production') {
    console.log('🔄 Loading production routes...');
    try {
      const { registerRoutes: registerProductionRoutes } = await import("./routes.production");
      server = await registerProductionRoutes(app);
    } catch (error) {
      console.error('❌ Failed to load production routes, falling back to development routes:', error instanceof Error ? error.message : 'Unknown error');
      const { registerRoutes } = await import("./routes");
      server = await registerRoutes(app);
    }
  } else {
    console.log('🔄 Loading development routes...');
    const { registerRoutes } = await import("./routes");
    server = await registerRoutes(app);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "development" && !process.env.DOCKER_ENV) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Port configuration: 5000 for development, 3000 for production
  const port = process.env.PORT || (process.env.NODE_ENV === 'production' ? 3000 : 5000);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
