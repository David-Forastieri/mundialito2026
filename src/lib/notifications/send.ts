import webpush from 'web-push'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

type DB = SupabaseClient<Database>

// Lazy VAPID initialization — avoids build-time errors when env vars are
// absent. Called once on first use; safe to call repeatedly (no-op after set).
let vapidReady = false
function ensureVapid(): boolean {
  if (vapidReady) return true
  const subject  = process.env.VAPID_SUBJECT
  const pubKey   = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privKey  = process.env.VAPID_PRIVATE_KEY
  if (!subject || !pubKey || !privKey) {
    console.warn('[push] VAPID env vars not configured — notifications skipped')
    return false
  }
  webpush.setVapidDetails(subject, pubKey, privKey)
  vapidReady = true
  return true
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
}

export async function sendPushToUser(db: DB, userId: string, payload: PushPayload) {
  if (!ensureVapid()) return   // skip silently if VAPID vars are missing

  const { data: profile } = await db
    .from('profiles')
    .select('push_token')
    .eq('id', userId)
    .single()

  if (!profile?.push_token) return

  try {
    const subscription = JSON.parse(profile.push_token) as webpush.PushSubscription
    await webpush.sendNotification(subscription, JSON.stringify(payload))
  } catch (err: unknown) {
    const status = (err as { statusCode?: number })?.statusCode
    if (status === 410 || status === 404) {
      // Subscription expired or unregistered — clear it
      await db.from('profiles').update({ push_token: null }).eq('id', userId)
    }
    console.error('[push] send error for user', userId, err)
  }
}

export async function sendPushToMany(db: DB, userIds: string[], payload: PushPayload) {
  await Promise.allSettled(userIds.map(uid => sendPushToUser(db, uid, payload)))
}
