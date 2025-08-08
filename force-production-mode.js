// Script pour diagnostiquer et forcer le mode production
import fs from 'fs';
import path from 'path';

console.log('🔍 DIAGNOSTIC ENVIRONMENT - Checking production mode...');

// Check current environment
console.log('📊 Environment variables:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
console.log(`   DOCKER_ENV: ${process.env.DOCKER_ENV || 'undefined'}`);
console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);
console.log(`   PWD: ${process.env.PWD || 'undefined'}`);

// Check package.json scripts
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log('\n📋 Package.json scripts:');
  Object.entries(packageJson.scripts || {}).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });
} catch (error) {
  console.error('❌ Error reading package.json:', error.message);
}

// Check server files
const serverFiles = [
  'server/index.ts',
  'server/index.production.ts', 
  'server/routes.ts',
  'server/routes.production.ts'
];

console.log('\n🔍 Server files check:');
serverFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const stats = fs.statSync(file);
    console.log(`   ✅ ${file} (${Math.round(stats.size/1024)}KB, modified: ${stats.mtime.toISOString().split('T')[0]})`);
  } else {
    console.log(`   ❌ ${file} - NOT FOUND`);
  }
});

// Check workflow configuration
if (fs.existsSync('.replit')) {
  console.log('\n📄 .replit configuration:');
  const replitConfig = fs.readFileSync('.replit', 'utf8');
  console.log(replitConfig);
}

console.log('\n🔧 SOLUTION STEPS:');
console.log('1. Force NODE_ENV=production in startup');
console.log('2. Ensure routes.production.ts is used');
console.log('3. Add comprehensive SAV logging');
console.log('4. Test SAV routes directly');

// Suggest fixes
console.log('\n💡 RECOMMENDED FIXES:');
console.log('- Update package.json dev script to use NODE_ENV=production');
console.log('- Modify server/index.ts to force production mode detection');
console.log('- Add SAV-specific diagnostic endpoints');
console.log('- Create production-ready fallback system');

console.log('\n✅ Environment diagnostic completed');