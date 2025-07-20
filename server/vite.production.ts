import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit", 
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Production version that doesn't import Vite
export async function setupVite() {
  // No-op in production
  return Promise.resolve();
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");
  
  log(`Serving static files from: ${distPath}`);
  
  // Serve static files from dist/public
  app.use(express.static(distPath, {
    maxAge: '1y',
    etag: false
  }));

  // Catch-all handler for SPA routing
  app.get("*", (req, res, next) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith("/api/")) {
      return next();
    }

    const indexPath = path.join(distPath, "index.html");
    
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Application not built. Run 'npm run build' first.");
    }
  });
}