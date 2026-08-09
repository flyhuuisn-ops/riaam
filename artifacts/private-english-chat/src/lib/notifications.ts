export function getDeviceInfo() {
  return `${navigator.platform || 'unknown'} · ${window.innerWidth}×${window.innerHeight}`;
}

export async function sendNotification(eventType: string, payload: Record<string, unknown>) {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !key) return;
  try {
    await fetch(`${url}/functions/v1/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ eventType, deviceInfo: getDeviceInfo(), ...payload }),
    });
  } catch { /* notifications are best effort */ }
}