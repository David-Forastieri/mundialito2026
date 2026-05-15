# 🚀 Deploy a Producción — Mundial 2026

## Resumen del pipeline

```
Push a develop → CI (lint + build)
PR a main      → CI + Preview Deploy en Vercel
Merge a main   → Deploy automático a Producción
```

---

## Paso 1 — Subir el código a GitHub

```bash
# En la carpeta del proyecto
git init
git add .
git commit -m "feat: initial commit Mundial 2026"

# Crear repo en github.com y luego:
git remote add origin https://github.com/TU-USUARIO/mundial2026.git
git branch -M main
git push -u origin main
```

---

## Paso 2 — Crear proyecto en Vercel

1. Ir a [vercel.com](https://vercel.com) → **Add New Project**
2. Importar el repositorio de GitHub
3. Framework: **Next.js** (lo detecta automático)
4. Hacer clic en **Deploy** (va a fallar por falta de env vars, está bien)

---

## Paso 3 — Configurar variables de entorno en Vercel

En Vercel → tu proyecto → **Settings → Environment Variables**, agregar:

| Variable | Valor | Entorno |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://smckwawrclmdqztudnmc.supabase.co` | All |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` | All |
| `SUPABASE_SECRET_KEY` | `sb_secret_...` | All |
| `NEXT_PUBLIC_SITE_URL` | `https://tu-dominio.vercel.app` | Production |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Development |
| `WEBHOOK_SECRET` | (secreto random) | All |
| `CRON_SECRET` | (secreto random) | All |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | (generado con web-push) | All |
| `VAPID_PRIVATE_KEY` | (generado con web-push) | All |
| `VAPID_SUBJECT` | `mailto:admin@tu-dominio.com` | All |

Para generar secretos random:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Para generar claves VAPID:
```bash
npx web-push generate-vapid-keys
```

---

## Paso 4 — Configurar GitHub Secrets para CI/CD

En GitHub → tu repo → **Settings → Secrets and variables → Actions**:

| Secret | Cómo obtenerlo |
|--------|----------------|
| `VERCEL_TOKEN` | vercel.com → Settings → Tokens → Create |
| `VERCEL_ORG_ID` | vercel.com → Settings → General → Team ID |
| `VERCEL_PROJECT_ID` | Vercel → tu proyecto → Settings → General → Project ID |

---

## Paso 5 — Actualizar Supabase para producción

En Supabase Dashboard → **Authentication → URL Configuration**:

- **Site URL:** `https://tu-dominio.vercel.app`
- **Redirect URLs:** 
  ```
  https://tu-dominio.vercel.app/auth/callback
  http://localhost:3000/auth/callback
  ```

---

## Paso 6 — Primer deploy

```bash
git add .
git commit -m "feat: add vercel config and CI/CD pipelines"
git push origin main
```

Vercel va a detectar el push y deployar automáticamente. El pipeline completo tarda ~2 minutos.

---

## Flujo de trabajo diario

```bash
# Nueva feature
git checkout -b feature/mi-feature
# ... cambios ...
git push origin feature/mi-feature
# Crear PR en GitHub → se genera preview automático
# Merge a main → deploy a producción automático
```

---

## Cron jobs en producción

El archivo `vercel.json` configura un cron que corre cada 6 horas para:
- Marcar como `live` los partidos que ya empezaron
- Lockear predicciones de partidos iniciados

Durante el Mundial podés cambiarlo a cada hora en `vercel.json`:
```json
{ "schedule": "0 * * * *" }
```

---

## Checklist final antes de lanzar

- [ ] Variables de entorno configuradas en Vercel
- [ ] GitHub Secrets configurados (VERCEL_TOKEN, ORG_ID, PROJECT_ID)
- [ ] Supabase redirect URLs actualizadas con dominio de producción
- [ ] OAuth providers (Google/GitHub) con redirect URI de producción
- [ ] Claves VAPID generadas y configuradas
- [ ] CRON_SECRET configurado
- [ ] Primer deploy exitoso en Vercel
