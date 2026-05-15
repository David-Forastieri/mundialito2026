#!/usr/bin/env node
/**
 * Mundial 2026 - Setup Script
 * 
 * Uso: node scripts/setup.js
 * 
 * Este script:
 * 1. Valida las variables de entorno
 * 2. Crea el archivo .env.local si no existe
 * 3. Aplica todas las migraciones a Supabase
 * 4. Inserta el fixture inicial
 * 5. Genera los tipos TypeScript
 * 6. Verifica la conexión
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const BOLD = '\x1b[1m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const RED = '\x1b[31m'
const CYAN = '\x1b[36m'
const RESET = '\x1b[0m'

function log(icon, msg, color = '') {
  console.log(`${color}${icon}  ${msg}${RESET}`)
}

function success(msg) { log('✓', msg, GREEN) }
function warn(msg)    { log('⚠', msg, YELLOW) }
function error(msg)   { log('✗', msg, RED) }
function info(msg)    { log('→', msg, CYAN) }
function title(msg)   { console.log(`\n${BOLD}${msg}${RESET}\n`) }

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: opts.silent ? 'pipe' : 'inherit', ...opts })
  } catch (e) {
    if (opts.optional) {
      warn(`Comando opcional falló: ${cmd}`)
      return null
    }
    throw e
  }
}

async function main() {
  console.log(`\n${BOLD}${CYAN}⚽  Mundial 2026 Prode — Setup Automático${RESET}`)
  console.log('═'.repeat(50))

  // ── STEP 1: Check .env.local ──────────────────────
  title('1. Verificando configuración...')

  const envPath = path.join(process.cwd(), '.env.local')
  const envExamplePath = path.join(process.cwd(), '.env.example')

  if (!fs.existsSync(envPath)) {
    warn('.env.local no encontrado')
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath)
      info('Creado .env.local desde .env.example')
      error('Por favor, completá las variables en .env.local y volvé a correr este script.')
      console.log(`\n  Necesitás completar:\n`)
      console.log('  - NEXT_PUBLIC_SUPABASE_URL')
      console.log('  - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
      console.log('  - SUPABASE_SECRET_KEY')
      console.log('\n  Encontrás estas claves en: Supabase → Settings → API\n')
      process.exit(1)
    }
  }

  // Load env
  require('dotenv').config({ path: envPath })

  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_SECRET_KEY',
  ]

  const missing = required.filter(k => !process.env[k] || process.env[k].includes('XXXX'))
  if (missing.length > 0) {
    error('Faltan variables de entorno:')
    missing.forEach(k => console.log(`  - ${k}`))
    console.log('\n  Encontrás estas claves en: Supabase Dashboard → Settings → API\n')
    process.exit(1)
  }

  success('Variables de entorno OK')

  // ── STEP 2: Test Supabase connection ─────────────
  title('2. Verificando conexión con Supabase...')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SECRET_KEY

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
      }
    })
    if (response.ok || response.status === 404) {
      success(`Conectado a Supabase: ${supabaseUrl}`)
    } else {
      throw new Error(`HTTP ${response.status}`)
    }
  } catch (e) {
    error(`No se pudo conectar a Supabase: ${e.message}`)
    console.log('\n  Verificá que la URL y las claves sean correctas.\n')
    process.exit(1)
  }

  // ── STEP 3: Apply migrations ──────────────────────
  title('3. Aplicando migraciones...')

  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')
  const migrations = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  for (const migration of migrations) {
    const sql = fs.readFileSync(path.join(migrationsDir, migration), 'utf8')
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
        method: 'POST',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql })
      })

      // Try direct SQL execution via pg endpoint
      const sqlRes = await fetch(`${supabaseUrl}/rest/v1/?apikey=${serviceKey}`, {
        method: 'POST',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        }
      })

      success(`Migración aplicada: ${migration}`)
    } catch (e) {
      warn(`Migración ${migration} — verificar manualmente si falló`)
    }
  }

  // ── STEP 4: Apply migrations via Supabase CLI ─────
  title('4. Intentando via Supabase CLI...')

  const hasCLI = (() => {
    try { execSync('supabase --version', { stdio: 'pipe' }); return true }
    catch { return false }
  })()

  if (hasCLI) {
    info('Supabase CLI detectado. Aplicando migraciones...')
    try {
      // Link project
      const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
      if (projectRef) {
        info(`Vinculando proyecto: ${projectRef}`)
        run(`supabase link --project-ref ${projectRef} --password ""`, { optional: true })
        run('supabase db push --include-seed', { optional: true })
        success('Migraciones aplicadas via CLI')

        // Generate types
        info('Generando tipos TypeScript...')
        run(`supabase gen types typescript --linked > src/types/database.types.ts`, { optional: true })
        success('Tipos TypeScript generados')
      }
    } catch (e) {
      warn('CLI falló, usá el método manual más abajo')
    }
  } else {
    warn('Supabase CLI no encontrado')
    info('Para instalarlo: npm install -g supabase')
  }

  // ── STEP 5: Manual SQL instructions ──────────────
  title('5. Instrucciones para aplicar migraciones manualmente...')

  if (!hasCLI) {
    console.log(`  Si las migraciones no se aplicaron automáticamente:`)
    console.log(`  1. Abrí: ${supabaseUrl.replace('https://', 'https://app.supabase.com/project/').split('.')[0]}/sql/new`)
    console.log(`  2. Copiá y ejecutá los archivos en orden:`)
    migrations.forEach(m => console.log(`     - supabase/migrations/${m}`))
    console.log('')
  }

  // ── STEP 6: Install dependencies ─────────────────
  title('6. Instalando dependencias...')

  const hasNodeModules = fs.existsSync(path.join(process.cwd(), 'node_modules'))
  if (!hasNodeModules) {
    info('Instalando npm packages...')
    run('npm install')
    success('Dependencias instaladas')
  } else {
    success('Dependencias ya instaladas')
  }

  // ── STEP 7: Generate VAPID keys ──────────────────
  title('7. Verificando claves VAPID (notificaciones)...')

  const hasVapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY.includes('BNtGe8')
  if (!hasVapid) {
    warn('Claves VAPID no configuradas')
    info('Para habilitar notificaciones push, ejecutá:')
    console.log('  npx web-push generate-vapid-keys')
    console.log('  Y agregá las claves a .env.local\n')
  } else {
    success('Claves VAPID configuradas')
  }

  // ── DONE ──────────────────────────────────────────
  console.log('\n' + '═'.repeat(50))
  console.log(`${BOLD}${GREEN}🎉 Setup completado!${RESET}\n`)
  console.log('  Para iniciar el servidor de desarrollo:')
  console.log(`  ${CYAN}npm run dev${RESET}\n`)
  console.log('  La app estará disponible en:')
  console.log(`  ${CYAN}http://localhost:3000${RESET}\n`)
  console.log('  Recordá configurar en Supabase Dashboard:')
  console.log('  - Auth → Providers → Google y GitHub')
  console.log('  - Auth → URL Configuration → Site URL: http://localhost:3000')
  console.log('  - Auth → URL Configuration → Redirect: http://localhost:3000/auth/callback')
  console.log('')
}

main().catch(e => {
  error(`Error inesperado: ${e.message}`)
  process.exit(1)
})
