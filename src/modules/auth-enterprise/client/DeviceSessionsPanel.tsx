'use client';

import { getOrCreateDeviceFingerprint } from './device-fingerprint';
import { Loader2, Monitor, Smartphone, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface DeviceRow {
  id: string;
  deviceName: string;
  lastSeenAt: string;
  isCurrent: boolean;
}

export function DeviceSessionsPanel() {
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const fp = getOrCreateDeviceFingerprint();
    const res = await fetch(`/api/modules/auth-enterprise/devices?fingerprint=${encodeURIComponent(fp)}`);
    const json = await res.json();
    if (json.ok && json.data) setDevices(json.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const revoke = async (id: string) => {
    await fetch('/api/modules/auth-enterprise/devices', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: id }),
    });
    load();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-foreground">Sesiones activas</h3>
      {devices.length === 0 ? (
        <p className="text-xs text-muted-foreground">No hay dispositivos registrados.</p>
      ) : (
        devices.map((d) => (
          <div
            key={d.id}
            className="flex items-center justify-between p-3 rounded-xl border border-border bg-card"
          >
            <div className="flex items-center gap-3">
              {d.deviceName.includes('iOS') || d.deviceName.includes('Android') ? (
                <Smartphone className="w-4 h-4 text-primary" />
              ) : (
                <Monitor className="w-4 h-4 text-primary" />
              )}
              <div>
                <p className="text-sm font-semibold">
                  {d.deviceName}
                  {d.isCurrent && (
                    <span className="ml-2 text-[10px] text-success font-bold">ACTUAL</span>
                  )}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Último acceso: {new Date(d.lastSeenAt).toLocaleString()}
                </p>
              </div>
            </div>
            {!d.isCurrent && (
              <button
                type="button"
                onClick={() => revoke(d.id)}
                className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                title="Revocar sesión"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}
