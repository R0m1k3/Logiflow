import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import session from 'express-session';
import { pool } from './initDatabase.production';
import type { Express } from 'express';
import connectPg from 'connect-pg-simple';

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
    interface User {
      id: string;
      username: string;
      email: string;
      name: string;
      firstName: string;
      lastName: string;
      profileImageUrl?: string;
      role: string;
      passwordChanged: boolean;
    }
  }
}

import { hashPassword, comparePasswords } from './auth-utils.production';

export function setupLocalAuth(app: Express) {
  // Use MemoryStore for sessions when database is unavailable
  console.log('⚠️ Database unavailable, using memory store for sessions');
  
  app.use(session({
    secret: process.env.SESSION_SECRET || 'LogiFlow_Super_Secret_Session_Key_2025_Production',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    }
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy
  passport.use(new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'
  }, async (username, password, done) => {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );

      const user = result.rows[0];
      if (!user) {
        console.log('❌ Login failed: User not found:', username);
        return done(null, false, { message: 'Invalid username or password.' });
      }

      // Use comparePasswords for consistent hashing with same salt
      const isValidPassword = await comparePasswords(password, user.password);
      if (!isValidPassword) {
        console.log('❌ Login failed: Invalid password for user:', username);
        return done(null, false, { message: 'Invalid username or password.' });
      }

      console.log('✅ Login successful for user:', username, 'Role:', user.role);
      
      // Remove password from user object before returning
      const { password: _, ...userWithoutPassword } = user;
      return done(null, userWithoutPassword);
    } catch (error) {
      console.error('❌ Database authentication failed:', error);
      
      // Temporary fallback for when database is unavailable - only for admin
      if (username === 'admin' && password === 'admin') {
        console.log('⚠️ Using temporary admin access while database is unavailable');
        const tempAdmin = {
          id: 'temp_admin',
          username: 'admin',
          email: 'admin@logiflow.fr',
          name: 'Admin Temporaire',
          firstName: 'Admin',
          lastName: 'Temporaire',
          role: 'admin',
          passwordChanged: false
        };
        return done(null, tempAdmin);
      }
      
      return done(null, false, { message: 'Service temporarily unavailable' });
    }
  }));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      // Handle temporary admin user
      if (id === 'temp_admin') {
        const tempAdmin = {
          id: 'temp_admin',
          username: 'admin',
          email: 'admin@logiflow.fr',
          name: 'Admin Temporaire',
          firstName: 'Admin',
          lastName: 'Temporaire',
          role: 'admin',
          passwordChanged: false
        };
        return done(null, tempAdmin);
      }

      const result = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );

      const user = result.rows[0];
      if (!user) {
        return done(null, false);
      }

      // Return user object without password
      const userWithoutPassword = {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        firstName: user.first_name,
        lastName: user.last_name,
        profileImageUrl: user.profile_image_url,
        role: user.role,
        passwordChanged: user.password_changed
      };
      done(null, userWithoutPassword);
    } catch (error) {
      console.error('❌ Error deserializing user:', error);
      done(null, false);
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
      // When database is unavailable, show default credentials for temporary access
      res.json({ showDefault: true });
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