import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import session from 'express-session';
import { pool } from './initDatabase.production';
import type { Express } from 'express';

// Import connect-pg-simple using ES6 import
import connectPgSimple from 'connect-pg-simple';
const PgSession = connectPgSimple(session);

// Import memory store for fallback when database is unavailable  
import memorystore from 'memorystore';
const MemoryStore = memorystore(session);

interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  password: string;
  role: string;
  passwordChanged: boolean;
}

declare global {
  namespace Express {
    interface User extends User {}
  }
}

// Import des fonctions de hachage (une seule fois)
import { hashPassword, comparePasswords } from './auth-utils.production';

export function setupLocalAuth(app: Express) {
  // Configure session with memory store (no database dependency)
  console.log('🔧 PRODUCTION FALLBACK: Using memory store for sessions');
  app.use(session({
    store: new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    secret: process.env.SESSION_SECRET || 'LogiFlow_Super_Secret_Session_Key_2025_Production',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      secure: false, // Set to true if using HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax'
    }
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // HARDCODED USERS FOR PRODUCTION FALLBACK
  const hardcodedUsers = {
    'admin': {
      id: 'admin_fallback',
      username: 'admin',
      email: 'admin@logiflow.com',
      name: 'Admin Utilisateur',
      firstName: 'Admin',
      lastName: 'Utilisateur',
      password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      role: 'admin',
      passwordChanged: true
    },
    'directeur': {
      id: 'directeur_fallback',
      username: 'directeur',
      email: 'directeur@logiflow.com',
      name: 'Directeur Test',
      firstName: 'Directeur',
      lastName: 'Test',
      password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      role: 'directeur',
      passwordChanged: true
    },
    'manager': {
      id: 'manager_fallback',
      username: 'manager',
      email: 'manager@logiflow.com',
      name: 'Manager Test',
      firstName: 'Manager',
      lastName: 'Test',
      password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      role: 'manager',
      passwordChanged: true
    },
    'employee': {
      id: 'employee_fallback',
      username: 'employee',
      email: 'employee@logiflow.com',
      name: 'Employee Test',
      firstName: 'Employee',
      lastName: 'Test',
      password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      role: 'employee',
      passwordChanged: true
    }
  };

  // Configure local strategy with hardcoded users
  passport.use(new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'
  }, async (username, password, done) => {
    try {
      console.log(`🔑 HARDCODED AUTH: Attempting login for ${username}`);
      
      const user = hardcodedUsers[username as keyof typeof hardcodedUsers];
      if (!user) {
        console.log('❌ Login failed: User not found in hardcoded users:', username);
        return done(null, false, { message: 'Invalid username or password.' });
      }

      // Simple password check for hardcoded users (all users have password "password")
      if (password !== 'password') {
        console.log('❌ Login failed: Invalid password for user:', username);
        return done(null, false, { message: 'Invalid username or password.' });
      }

      console.log('✅ HARDCODED AUTH: Login successful for user:', username, 'Role:', user.role);
      
      // Remove password from user object before returning
      const { password: _, ...userWithoutPassword } = user;
      return done(null, userWithoutPassword);
    } catch (error) {
      console.error('❌ Authentication error:', error);
      return done(error);
    }
  }));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      console.log(`🔑 HARDCODED DESERIALIZE: Looking up user with ID: ${id}`);
      
      // Find user in hardcoded users by ID
      const user = Object.values(hardcodedUsers).find(u => u.id === id);
      if (!user) {
        console.log(`❌ HARDCODED DESERIALIZE: User with ID ${id} not found in hardcoded users`);
        return done(null, false);
      }

      console.log(`✅ HARDCODED DESERIALIZE: Found user ${user.username} with role ${user.role}`);
      
      // Remove password from user object before returning
      const { password: _, ...userWithoutPassword } = user;
      done(null, userWithoutPassword);
    } catch (error) {
      console.error('❌ Error deserializing user:', error);
      done(error);
    }
  });

  // Authentication routes
  app.post('/api/login', passport.authenticate('local'), (req: any, res) => {
    if (req.user) {
      console.log('✅ User authenticated successfully:', req.user.username);
      res.json({
        success: true,
        user: {
          id: req.user.id,
          username: req.user.username,
          email: req.user.email,
          name: req.user.name,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          profileImageUrl: req.user.profileImageUrl,
          role: req.user.role,
          passwordChanged: req.user.passwordChanged
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Authentication failed' });
    }
  });

  app.get('/api/user', async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const userId = req.user.id;
      
      // Import storage production directly
      const { DatabaseStorage } = await import('./storage.production.js');
      const storage = new DatabaseStorage();
      const userWithGroups = await storage.getUserWithGroups(userId);
      
      if (!userWithGroups) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json(userWithGroups);
    } catch (error) {
      console.error("Error fetching user with groups:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Route removed - handled in routes.production.ts to avoid conflict

  app.post('/api/logout', (req: any, res) => {
    req.logout((err: any) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: 'Logout failed' });
      }
      req.session.destroy((err: any) => {
        if (err) {
          console.error('Session destroy error:', err);
          return res.status(500).json({ message: 'Session destroy failed' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully' });
      });
    });
  });

  // Check if default credentials should be shown
  app.get("/api/default-credentials-check", async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT password_changed FROM users WHERE username = $1',
        ['admin']
      );
      const adminUser = result.rows[0];
      const showDefault = adminUser && !adminUser.password_changed;
      res.json({ showDefault: !!showDefault });
    } catch (error) {
      console.error('Error checking default credentials:', error);
      res.json({ showDefault: true }); // Default to showing credentials if error
    }
  });

  console.log('✅ Local authentication configured');
}

export const requireAuth = (req: any, res: any, next: any) => {
  // 🔍 DEBUG PRODUCTION: Diagnostiquer l'authentification
  console.log('🔍 PRODUCTION AUTH DEBUG:', {
    url: req.url,
    method: req.method,
    isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : 'NO_FUNCTION',
    hasUser: !!req.user,
    userId: req.user?.id,
    username: req.user?.username,
    sessionId: req.sessionID,
    hasSession: !!req.session,
    sessionData: req.session ? Object.keys(req.session) : 'NO_SESSION',
    cookies: req.headers.cookie ? 'HAS_COOKIES' : 'NO_COOKIES'
  });
  
  if (req.isAuthenticated && req.isAuthenticated()) {
    console.log('✅ PRODUCTION AUTH: User authenticated, proceeding');
    return next();
  }
  
  console.log('❌ PRODUCTION AUTH: Authentication failed, returning 401');
  res.status(401).json({ 
    message: 'Authentication required',
    debug: {
      isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
      hasUser: !!req.user,
      hasSession: !!req.session
    }
  });
};