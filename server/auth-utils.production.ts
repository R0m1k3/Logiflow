import crypto from 'crypto';

/**
 * Alternative à bcrypt pour production Docker Alpine
 * Utilise crypto natif Node.js (pas de compilation nécessaire)
 */

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  // Générer un salt aléatoire
  const salt = crypto.randomBytes(16).toString('hex');
  
  // Créer le hash avec PBKDF2 (sécurisé et natif)
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  
  // Retourner salt + hash combinés
  return `${salt}:${hash}`;
}

export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  try {
    console.log('🔐 comparePasswords DEBUG:', {
      passwordLength: password.length,
      hashedPasswordFormat: hashedPassword.substring(0, 20) + '...',
      hasColon: hashedPassword.includes(':'),
      hasDot: hashedPassword.includes('.')
    });
    
    // Vérifier si c'est un hash de développement (format scrypt avec point)
    if (hashedPassword.includes('.')) {
      console.log('🔧 Detected development hash format - attempting migration');
      return compareScryptPassword(password, hashedPassword);
    }
    
    // Séparer le salt du hash (format production PBKDF2)
    const [salt, originalHash] = hashedPassword.split(':');
    
    if (!salt || !originalHash) {
      console.log('❌ Invalid PBKDF2 hash format:', { salt: !!salt, originalHash: !!originalHash });
      return false;
    }
    
    console.log('🔐 PBKDF2 verification:', {
      saltLength: salt.length,
      originalHashLength: originalHash.length,
      passwordProvided: password
    });
    
    // Recalculer le hash avec le même salt
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    
    console.log('🔐 Hash comparison:', {
      generatedHashLength: hash.length,
      originalHashLength: originalHash.length,
      hashesMatch: hash === originalHash
    });
    
    // Comparaison sécurisée
    const result = crypto.timingSafeEqual(Buffer.from(originalHash, 'hex'), Buffer.from(hash, 'hex'));
    console.log('🔐 Final comparison result:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error comparing passwords:', error);
    return false;
  }
}

// Fonction pour comparer les mots de passe de développement (format scrypt)
function compareScryptPassword(password: string, hashedPassword: string): boolean {
  try {
    const [hashed, salt] = hashedPassword.split('.');
    if (!hashed || !salt) {
      return false;
    }
    
    const hashedBuf = Buffer.from(hashed, 'hex');
    const suppliedBuf = crypto.scryptSync(password, salt, 64) as Buffer;
    return crypto.timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error('Error comparing scrypt password:', error);
    return false;
  }
}

// Fonction pour migrer les anciens hashes bcrypt si nécessaire
export function isBcryptHash(hash: string): boolean {
  return hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$');
}

// Fonction pour générer le hash par défaut de l'admin
export async function getDefaultAdminHash(): Promise<string> {
  return await hashPassword('admin');
}