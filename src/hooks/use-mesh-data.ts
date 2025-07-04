'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MeshUnit, UnitType } from '@/types/mesh';

const baseCoords = { lat: 53.19745, lng: 10.84507 };

const initialUnits: MeshUnit[] = [
  {
    id: 1,
    name: 'HLF-20',
    type: 'Vehicle',
    status: 'Online',
    position: { lat: baseCoords.lat, lng: baseCoords.lng },
    speed: 0,
    heading: 45,
    battery: 95,
    timestamp: Date.now(),
    sendInterval: 5,
    isActive: true,
  },
  {
    id: 2,
    name: 'AT-1',
    type: 'Personnel',
    status: 'Online',
    position: { lat: baseCoords.lat + 0.001, lng: baseCoords.lng + 0.001 },
    speed: 3,
    heading: 180,
    battery: 88,
    timestamp: Date.now(),
    sendInterval: 10,
    isActive: true,
  },
  {
    id: 3,
    name: 'ELW-1',
    type: 'Vehicle',
    status: 'Alarm',
    position: { lat: baseCoords.lat - 0.001, lng: baseCoords.lng - 0.001 },
    speed: 0,
    heading: 270,
    battery: 15,
    timestamp: Date.now(),
    sendInterval: 5,
    isActive: true,
  },
    {
    id: 4,
    name: 'AT-2',
    type: 'Personnel',
    status: 'Offline',
    position: { lat: baseCoords.lat + 0.002, lng: baseCoords.lng - 0.002 },
    speed: 0,
    heading: 0,
    battery: 0,
    timestamp: Date.now() - 600000,
    sendInterval: 30,
    isActive: false,
  },
];

const names: Record<UnitType, string[]> = {
    Vehicle: ['RTW', 'NEF', 'GW-L', 'DLK-23', 'TSF-W'],
    Personnel: ['GF', 'ZF', 'MA', 'SAN', 'PA-1', 'PA-2'],
}

export function useMeshData() {
  const [units, setUnits] = useState<MeshUnit[]>(initialUnits);

  useEffect(() => {
    const interval = setInterval(() => {
      setUnits(currentUnits =>
        currentUnits.map(unit => {
          if (!unit.isActive) {
            return {...unit, status: 'Offline'};
          }

          // Simulate battery drain
          const batteryDrain = unit.battery > 0 ? 0.05 / (unit.sendInterval / 5) : 0;
          const newBattery = Math.max(0, unit.battery - batteryDrain);

          // Simulate movement
          let { lat, lng } = unit.position;
          const newHeading = (unit.heading + (Math.random() - 0.5) * 10) % 360;
          const newSpeed = Math.max(0, unit.speed + (Math.random() - 0.5) * 2);
          
          if (newSpeed > 1) {
             const distance = (newSpeed / 3600) * 1; // 1s interval
             const angleRad = (newHeading * Math.PI) / 180;
             lat += distance * Math.cos(angleRad) * 0.01; // Scaled for visibility
             lng += distance * Math.sin(angleRad) * 0.01;
          }

          let newStatus = unit.status;
          if (newBattery === 0) {
            newStatus = 'Offline';
          } else if (newStatus !== 'Alarm') {
            if (newSpeed > 1) newStatus = 'Moving';
            else newStatus = 'Idle';
          }


          return {
            ...unit,
            position: { lat, lng },
            speed: parseFloat(newSpeed.toFixed(1)),
            heading: parseInt(newHeading.toFixed(0)),
            battery: parseFloat(newBattery.toFixed(2)),
            status: newStatus,
            isActive: newBattery > 0,
            timestamp: Date.now(),
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const updateUnit = useCallback((updatedUnit: MeshUnit) => {
    setUnits(currentUnits =>
      currentUnits.map(u => (u.id === updatedUnit.id ? updatedUnit : u))
    );
  }, []);

  const addUnit = useCallback(() => {
    setUnits(currentUnits => {
        const newId = Math.max(0, ...currentUnits.map(u => u.id)) + 1;
        const type: UnitType = Math.random() > 0.5 ? 'Vehicle' : 'Personnel';
        const name = `${names[type][Math.floor(Math.random() * names[type].length)]}-${newId}`;
        const newUnit: MeshUnit = {
            id: newId,
            name,
            type,
            status: 'Online',
            position: { lat: baseCoords.lat + (Math.random() - 0.5) * 0.01, lng: baseCoords.lng + (Math.random() - 0.5) * 0.01 },
            speed: 0,
            heading: Math.floor(Math.random() * 360),
            battery: 100,
            timestamp: Date.now(),
            sendInterval: 10,
            isActive: true,
        };
        return [...currentUnits, newUnit];
    });
  }, []);

  const removeUnit = useCallback((unitId: number) => {
    setUnits(currentUnits => currentUnits.filter(u => u.id !== unitId));
  }, []);

  const chargeUnit = useCallback((unitId: number) => {
    setUnits(currentUnits =>
      currentUnits.map(u => {
        if (u.id === unitId) {
          return {
            ...u,
            battery: 100,
            status: u.status === 'Offline' ? 'Online' : u.status,
            isActive: true,
          };
        }
        return u;
      })
    );
  }, []);


  return { units, updateUnit, addUnit, removeUnit, chargeUnit };
}
