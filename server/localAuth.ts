import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual, pbkdf2Sync } from "crypto";
import { promisify } from "util";
import { storage as devStorage } from "./storage";
import { storage as prodStorage } from "./storage.production";

// Choose storage based on environment - but skip if no DATABASE_URL
const hasDatabase = !!process.env.DATABASE_URL;
const storage = hasDatabase ? (process.env.STORAGE_MODE === 'production' ? prodStorage : devStorage) : null;

// Fallback user for development testing when database is unavailable
const fallbackAdminUser = {
  id: 'admin_fallback',
  username: 'admin',
  email: 'admin@logiflow.com',
  name: 'Admin Utilisateur',
  firstName: 'Admin',
  lastName: 'Utilisateur',
  role: 'admin' as const,
  passwordChanged: true,
  createdAt: new Date(),
  updatedAt: new Date()
};
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  console.log('🔐 comparePasswords:', { supplied: 'HIDDEN', stored: stored?.substring(0, 20) + '...', hasFormat: stored?.includes('.') });
  
  // 🔧 CORRECTION CRITIQUE: Support des deux formats de hash
  
  // Format production PBKDF2 avec deux-points
  if (stored && stored.includes(':')) {
    console.log('🔧 Using production PBKDF2 format');
    try {
      const [salt, originalHash] = stored.split(':');
      
      if (!salt || !originalHash) {
        console.error('❌ Invalid PBKDF2 hash format');
        return false;
      }
      
      // Recalculer le hash avec le même salt
      // Déterminer la longueur du hash attendu
      const expectedLength = originalHash.length / 2; // Longueur en bytes (hex = 2 chars par byte)
      const hash = pbkdf2Sync(supplied, salt, 100000, expectedLength, expectedLength === 32 ? 'sha256' : 'sha512').toString('hex');
      
      // Comparaison sécurisée - vérifier d'abord les longueurs
      if (originalHash.length !== hash.length) {
        console.error('❌ Hash length mismatch:', { originalLen: originalHash.length, newLen: hash.length });
        return false;
      }
      
      const result = timingSafeEqual(Buffer.from(originalHash, 'hex'), Buffer.from(hash, 'hex'));
      console.log('🔐 PBKDF2 password comparison result:', result);
      return result;
    } catch (error) {
      console.error('❌ Error comparing PBKDF2 passwords:', error);
      return false;
    }
  }
  
  // Format développement scrypt avec point (ancien format)
  if (stored && stored.includes('.')) {
    console.log('🔧 Using development scrypt format');
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) {
      console.error('❌ Missing hash or salt:', { hasHash: !!hashed, hasSalt: !!salt });
      return false;
    }
    
    try {
      const hashedBuf = Buffer.from(hashed, "hex");
      const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
      const result = timingSafeEqual(hashedBuf, suppliedBuf);
      console.log('🔐 Scrypt password comparison result:', result);
      return result;
    } catch (error) {
      console.error('❌ Error comparing scrypt passwords:', error);
      return false;
    }
  }
  
  // Format invalide
  console.error('❌ Invalid password format - no separator found:', { stored });
  return false;
}

async function createDefaultAdminUser() {
  // Skip admin user creation if no database storage available
  if (!storage) {
    console.log('🔧 Skipping admin user creation - no database storage in development mode');
    return;
  }

  try {
    const existingAdmin = await storage.getUserByUsername('admin');
    if (!existingAdmin) {
      const hashedPassword = await hashPassword('admin');
      await storage.createUser({
        id: 'admin_local',
        username: 'admin',
        email: 'admin@logiflow.com',
        firstName: 'Administrateur',
        lastName: 'Système',
        password: hashedPassword,
        role: 'admin',
        passwordChanged: false,
      });
      console.log('✅ Admin user created: admin / admin');
    } else {
      // Corriger le mot de passe admin si le format est incorrect
      if (!existingAdmin.password || !existingAdmin.password.includes('.')) {
        console.log('🔧 Fixing admin password format...');
        const hashedPassword = await hashPassword('admin');
        await storage.updateUser(existingAdmin.id, { 
          password: hashedPassword,
          passwordChanged: false 
        });
        console.log('✅ Admin password format fixed');
      }
    }
  } catch (error) {
    console.error('Error managing admin user:', error);
  }
}

export function setupLocalAuth(app: Express) {
  // Create admin user on startup
  createDefaultAdminUser();
  
  // Use memory store in development, PostgreSQL in production
  let sessionSettings: session.SessionOptions;
  
  if (process.env.STORAGE_MODE === 'production' && process.env.DATABASE_URL) {
    const PostgresSessionStore = connectPg(session);
    const sessionStore = new PostgresSessionStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false,
      tableName: 'session',
    });

    sessionSettings = {
      secret: process.env.SESSION_SECRET || 'fallback-secret-key',
      resave: false,
      saveUninitialized: false,
      store: sessionStore,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    };
  } else {
    // Memory session store for development
    console.log('🔧 Using memory session store for development');
    sessionSettings = {
      secret: process.env.SESSION_SECRET || 'dev-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    };
  }

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: 'username',
        passwordField: 'password',
      },
      async (username, password, done) => {
        try {
          // FALLBACK: Allow admin/admin when database is unavailable
          if (!storage) {
            console.log('🔧 FALLBACK: Database unavailable, checking fallback credentials');
            if (username === 'admin' && password === 'admin') {
              console.log('✅ FALLBACK: Admin credentials accepted');
              return done(null, fallbackAdminUser);
            } else {
              console.log('❌ FALLBACK: Invalid fallback credentials');
              return done(null, false, { message: 'Identifiant ou mot de passe incorrect' });
            }
          }

          const user = await storage.getUserByUsername(username);
          if (!user || !user.password) {
            return done(null, false, { message: 'Identifiant ou mot de passe incorrect' });
          }

          const isValidPassword = await comparePasswords(password, user.password);
          if (!isValidPassword) {
            return done(null, false, { message: 'Identifiant ou mot de passe incorrect' });
          }

          return done(null, user);
        } catch (error) {
          console.error('❌ LocalStrategy error:', error.message);
          
          // FALLBACK: Si erreur de base de données, essayer les credentials de fallback
          if (error.message?.includes('endpoint has been disabled') || error.message?.includes('connection')) {
            console.log('🔧 FALLBACK: Database error, checking fallback credentials');
            if (username === 'admin' && password === 'admin') {
              console.log('✅ FALLBACK: Admin credentials accepted after DB error');
              return done(null, fallbackAdminUser);
            }
          }
          
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      if (!storage) {
        // Return fallback admin user for development mode
        return done(null, fallbackAdminUser);
      }
      const user = await storage.getUserWithGroups(id);
      done(null, user);
    } catch (error) {
      console.error('❌ deserializeUser error:', error.message);
      
      // FALLBACK: Si erreur de base de données, retourner l'utilisateur fallback admin
      if (error.message?.includes('endpoint has been disabled') || error.message?.includes('connection')) {
        console.log('🔧 FALLBACK: Database error in deserializeUser, using fallback admin');
        return done(null, fallbackAdminUser);
      }
      
      done(error);
    }
  });



  // Login route
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentification échouée" });
      }
      
      req.login(user, (err) => {
        if (err) return next(err);
        res.json({ 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          firstName: user.firstName, 
          lastName: user.lastName, 
          role: user.role,
          passwordChanged: user.passwordChanged 
        });
      });
    })(req, res, next);
  });

  // Logout routes (both GET and POST for compatibility)
  const logoutHandler = (req: any, res: any, next: any) => {
    req.logout((err: any) => {
      if (err) return next(err);
      req.session.destroy((err: any) => {
        if (err) return next(err);
        res.clearCookie('connect.sid', { path: '/' });
        // Force redirect to login page for both GET and POST
        res.redirect('/auth');
      });
    });
  };
  
  app.post("/api/logout", logoutHandler);
  app.get("/api/logout", logoutHandler);

  // Get current user with groups
  app.get("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Non authentifié" });
    }
    try {
      const user = req.user as SelectUser;
      
      // FALLBACK: Si pas de stockage ou erreur, retourner l'utilisateur fallback avec groupes simulés
      if (!storage) {
        const fallbackUserWithGroups = {
          ...fallbackAdminUser,
          userGroups: [] // Admin a accès à tous les groupes
        };
        return res.json(fallbackUserWithGroups);
      }
      
      const userWithGroups = await storage.getUserWithGroups(user.id);
      
      if (!userWithGroups) {
        return res.status(404).json({ message: "Utilisateur introuvable" });
      }
      
      res.json(userWithGroups);
    } catch (error) {
      console.error("Error fetching user with groups:", error.message);
      
      // FALLBACK: En cas d'erreur de base de données, retourner l'utilisateur fallback
      if (error.message?.includes('endpoint has been disabled') || error.message?.includes('connection')) {
        console.log('🔧 FALLBACK: Database error in /api/user, using fallback admin');
        const fallbackUserWithGroups = {
          ...fallbackAdminUser,
          userGroups: [] // Admin a accès à tous les groupes
        };
        return res.json(fallbackUserWithGroups);
      }
      
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Get current user's permissions
  app.get("/api/user/permissions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Non authentifié" });
    }
    
    try {
      const user = req.user as SelectUser;
      console.log('🔍 Fetching permissions for user:', user.id);
      
      // Si c'est un admin, il a toutes les permissions
      if (user.role === 'admin') {
        const allPermissions = await storage.getPermissions();
        console.log('🔧 Admin user - returning all permissions:', allPermissions.length);
        return res.json(allPermissions);
      }

      // Pour les autres rôles, récupérer les permissions via le rôle
      const permissions = await storage.getUserEffectivePermissions(user.id);
      console.log('📝 User permissions found:', permissions.length);
      
      res.json(permissions || []);
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      res.status(500).json({ message: "Failed to fetch user permissions" });
    }
  });

  // Check if default credentials should be shown
  app.get("/api/default-credentials-check", async (req, res) => {
    try {
      const adminUser = await storage.getUserByUsername('admin');
      const showDefault = adminUser && !adminUser.passwordChanged;
      res.json({ showDefault: !!showDefault });
    } catch (error) {
      res.json({ showDefault: true }); // Default to showing credentials if error
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok", auth: "local" });
  });
}

export const requireAuth = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentification requise" });
  }
  next();
};