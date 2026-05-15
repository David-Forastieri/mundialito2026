# ⚽ Mundial 2026 Prode

Plataforma PWA para el Mundial de Fútbol 2026. Fixture en tiempo real + sistema de predicciones competitivo en grupos cerrados.

## Stack

- **Next.js 15** (App Router + Server Actions)
- **Supabase** (PostgreSQL + Auth + Realtime + Edge Functions)
- **Tailwind CSS v4**
- **TypeScript** estricto
- **PWA** con Service Worker + Web Push

---

## 🚀 Inicio rápido

### 1. Clonar y configurar

```bash
git clone <repo>
cd mundial-2026
cp .env.example .env.local
```

### 2. Configurar Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com)
2. Ir a **Settings → API** y copiar:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`
3. Completar esos valores en `.env.local`

### 3. Configurar OAuth (opcional)

**Google:**
1. Ir a [console.cloud.google.com](https://console.cloud.google.com)
2. Crear proyecto → APIs → Credentials → OAuth 2.0 Client ID
3. Authorized redirect URI: `https://TU-PROYECTO.supabase.co/auth/v1/callback`
4. Copiar Client ID y Secret a `.env.local`
5. En Supabase: Authentication → Providers → Google → Habilitar

**GitHub:**
1. Ir a [github.com/settings/developers](https://github.com/settings/developers)
2. New OAuth App → Homepage: `http://localhost:3000`
3. Callback: `https://TU-PROYECTO.supabase.co/auth/v1/callback`
4. Copiar Client ID y Secret a `.env.local`
5. En Supabase: Authentication → Providers → GitHub → Habilitar

### 4. Configurar Supabase Auth URLs

En Supabase Dashboard → Authentication → URL Configuration:
- **Site URL:** `http://localhost:3000`
- **Redirect URLs:** `http://localhost:3000/auth/callback`

### 5. Correr el setup automático

```bash
npm run setup
```

Este script:
- ✓ Valida las variables de entorno
- ✓ Verifica la conexión con Supabase
- ✓ Aplica todas las migraciones (tablas, RLS, funciones)
- ✓ Inserta el fixture inicial del Mundial 2026
- ✓ Instala las dependencias npm

### 6. (Alternativa) Aplicar migraciones manualmente

Si el setup automático falla, podés aplicar los archivos SQL manualmente:

1. Ir a Supabase → **SQL Editor**
2. Correr en orden:
   - `supabase/migrations/001_profiles.sql`
   - `supabase/migrations/002_groups.sql`
   - `supabase/migrations/003_matches.sql`
   - `supabase/migrations/004_predictions.sql`
   - `supabase/migrations/005_functions.sql`
   - `supabase/migrations/006_seed_fixture.sql`

### 7. Iniciar el servidor

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

---

## 📁 Estructura del proyecto

```
src/
├── app/
│   ├── (auth)/         # Login, Register, Callback
│   ├── (dashboard)/    # Home, Fixture, Grupos, Perfil
│   └── api/            # REST endpoints
├── components/         # Componentes por dominio
├── lib/
│   ├── supabase/       # Clientes SSR + Realtime
│   ├── scoring/        # Calculadora de puntos
│   ├── invite/         # Generador de códigos
│   └── notifications/  # Web Push
├── services/           # Acceso a datos tipado
├── types/              # Interfaces TypeScript
└── hooks/              # Custom React Hooks

supabase/
├── migrations/         # SQL migrations en orden
├── functions/          # Edge Functions (Deno)
└── config.toml
```

---

## 🎯 Sistema de puntos

| Evento | Puntos |
|--------|--------|
| Acierto de tendencia (ganador/empate) | 3 pts |
| Acierto de resultado exacto (solo modo exacto) | +2 pts bonus |
| País clasifica a siguiente fase | 1 pt |
| Posición exacta en el grupo | +2 pts |
| Acierto en eliminatoria directa | 2 pts |

---

## 🔧 Variables de entorno

| Variable | Descripción | Dónde obtenerla |
|----------|-------------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave admin (🔒 server only) | Supabase → Settings → API |
| `WEBHOOK_SECRET` | Secreto para webhooks | `openssl rand -hex 32` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Push notifications | `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | Push notifications (🔒) | `npx web-push generate-vapid-keys` |
| `GOOGLE_CLIENT_ID` | OAuth Google | Google Cloud Console |
| `GITHUB_CLIENT_ID` | OAuth GitHub | GitHub → Settings → Developers |

---

## 📱 PWA

La app funciona como PWA instalable. Para probar en Chrome:
1. Abrir `http://localhost:3000`
2. En la barra de direcciones → icono de instalar (⊕)
3. Instalar la app

Para notificaciones push, necesitás HTTPS en producción (o usar ngrok en desarrollo).

---

## 🚀 Deploy en producción

### Vercel (recomendado)

```bash
npm install -g vercel
vercel --prod
```

Configurar las variables de entorno en Vercel Dashboard.

Actualizar en Supabase:
- Site URL → tu dominio de producción
- Redirect URLs → `https://tu-dominio.com/auth/callback`

---

## 📊 Comandos útiles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run setup        # Setup automático completo
npm run db:types     # Regenerar tipos TypeScript desde Supabase
npm run db:migrate   # Aplicar migraciones via Supabase CLI
npm run db:reset     # Resetear base de datos (⚠️ borra todo)
```
