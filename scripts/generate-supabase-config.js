const fs = require('node:fs');
const path = require('node:path');

const url = (process.env.SUPABASE_URL || '').trim();
const key = (process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '').trim();

if (!url || !key) {
  throw new Error('Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in the Netlify environment.');
}

if (!/^https:\/\//i.test(url)) {
  throw new Error('SUPABASE_URL must use HTTPS.');
}

function isPublicKey(value) {
  if (value.startsWith('sb_publishable_')) return true;
  const parts = value.split('.');
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return payload.role === 'anon';
  } catch (error) {
    return false;
  }
}

if (!isPublicKey(key)) {
  throw new Error('Use only a Supabase publishable/anon key. Secret and service_role keys are not allowed.');
}

const output = 'window.LMARIA_SUPABASE_CONFIG = ' + JSON.stringify({
  url: url,
  anonKey: key
}) + ';\n';
const configPath = path.join(__dirname, '..', 'js', 'supabase-config.js');
fs.writeFileSync(configPath, output, 'utf8');
console.log('Generated browser Supabase configuration.');
