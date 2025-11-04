
import { useState, useEffect } from 'react';

interface BatteryState {
  level: number;
  charging: boolean;
}

interface NetworkState {
  isOnline: boolean;
}

export function useDeviceStatus() {
  const [batteryState, setBatteryState] = useState<BatteryState | null>(null);
  const [networkState, setNetworkState] = useState<NetworkState>({ isOnline: navigator.onLine });

  useEffect(() => {
    const handleOnline = () => setNetworkState({ isOnline: true });
    const handleOffline = () => setNetworkState({ isOnline: false });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Battery Status API
    let battery: any; 

    const updateBatteryStatus = () => {
      if (battery) {
        setBatteryState({
          level: Math.round(battery.level * 100),
          charging: battery.charging,
        });
      }
    };

    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((bat: any) => {
        battery = bat;
        updateBatteryStatus();
        battery.addEventListener('chargingchange', updateBatteryStatus);
        battery.addEventListener('levelchange', updateBatteryStatus);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (battery) {
        battery.removeEventListener('chargingchange', updateBatteryStatus);
        battery.removeEventListener('levelchange', updateBatteryStatus);
      }
    };
  }, []);

  return { batteryState, networkState };
}
