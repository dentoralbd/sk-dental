import clinicConfig from '@/config/clinic.json'

const APP_AUTH_STORAGE_KEY = clinicConfig.storageKeys.auth
const APP_ACTOR_STORAGE_KEY = clinicConfig.storageKeys.actorId

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function isAppAuthenticated() {
  return canUseStorage() && localStorage.getItem(APP_AUTH_STORAGE_KEY) === 'true'
}

export function getOrCreateAppActorId() {
  if (!canUseStorage()) return 'sk-dental-local'

  let actorId = localStorage.getItem(APP_ACTOR_STORAGE_KEY)
  if (actorId) return actorId

  actorId = globalThis.crypto?.randomUUID?.() || `sk-dental-${Date.now()}-${Math.random().toString(16).slice(2)}`
  localStorage.setItem(APP_ACTOR_STORAGE_KEY, actorId)
  return actorId
}

export function getScopedStorageKey(prefix: string) {
  return `${prefix}:${getOrCreateAppActorId()}`
}
