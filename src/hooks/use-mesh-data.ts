'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { MeshUnit, UnitType } from '@/types/mesh';

const MESH_DATA_STORAGE_KEY = 'mesh-data-state';
const baseCoords = { lat: 53.19745, lng: 10.84507 };

const initialUnits: MeshUnit[] = [
  {
    id: 1,
    name: 'HLF-20',
    type: 'Vehicle',
    status: 'Online',
    position: { lat: baseCoords.lat + (Math.random() - 0.5) * 0.02, lng: baseCoords.lng + (Math.random() - 0.5) * 0.02 },
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
    position: { lat: baseCoords.lat + (Math.random() - 0.5) * 0.02, lng: baseCoords.lng + (Math.random() - 0.5) * 0.02 },
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
    position: { lat: baseCoords.lat + (Math.random() - 0.5) * 0.02, lng: baseCoords.lng + (Math.random() - 0.5) * 0.02 },
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
    position: { lat: baseCoords.lat + (Math.random() - 0.5) * 0.02, lng: baseCoords.lng + (Math.random() - 0.5) * 0.02 },
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
  const [units, setUnits] = useState<MeshUnit[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const unitsRef = useRef(units);
  unitsRef.current = units;

  useEffect(() => {
    try {
      const storedState = localStorage.getItem(MESH_DATA_STORAGE_KEY);
      if (storedState) {
        const parsedUnits = JSON.parse(storedState) as MeshUnit[];
        setUnits(parsedUnits);
      } else {
        setUnits(initialUnits);
      }
    } catch (error) {
      console.error("Failed to load units from localStorage, using initial data.", error);
      setUnits(initialUnits);
    }
    setIsInitialized(true);

    const handleBeforeUnload = () => {
      if(unitsRef.current.length > 0) {
        try {
          localStorage.setItem(MESH_DATA_STORAGE_KEY, JSON.stringify(unitsRef.current));
        } catch (error) {
          console.error("Failed to save units to localStorage", error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);


  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    const interval = setInterval(() => {
      setUnits(currentUnits =>
        currentUnits.map(unit => {
          if (!unit.isActive) {
            return {...unit, status: 'Offline'};
          }

          const batteryDrain = unit.battery > 0 ? 0.05 / (unit.sendInterval / 5) : 0;
          const newBattery = Math.max(0, unit.battery - batteryDrain);

          let { lat, lng } = unit.position;
          let newHeading = unit.heading;
          let newSpeed = unit.speed;
          
          if (unit.type === 'Vehicle') {
            // Simulate driving on roads: higher speed, less erratic turns
            newSpeed = Math.max(0, Math.min(60, unit.speed + (Math.random() - 0.4) * 4)); // Tends to accelerate, caps at 60 km/h
            if (newSpeed > 1) {
              newHeading = (unit.heading + (Math.random() - 0.5) * 10) % 360; // Less sharp turns
            }
          } else { // Personnel
            // Simulate walking/running off-road: lower speed, more erratic turns
            newSpeed = Math.max(0, Math.min(7, unit.speed + (Math.random() - 0.5) * 2)); // Caps at running speed
            if (newSpeed > 0.5) {
              newHeading = (unit.heading + (Math.random() - 0.5) * 45) % 360; // Can change direction sharply
            }
          }

          if (newSpeed > 1) {
             const distance = (newSpeed / 3600) * 1; // 1s interval
             const angleRad = (newHeading * Math.PI) / 180;
             // The 0.01 scaling factor is to make movement visible on the map.
             // It's a simplification and doesn't correspond to real-world distances.
             lat += (distance * Math.cos(angleRad)) / 111.32 * 0.5;
             lng += (distance * Math.sin(angleRad)) / (111.32 * Math.cos(lat * Math.PI / 180)) * 0.5;
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
  }, [isInitialized]);

  const updateUnit = useCallback((updatedUnit: MeshUnit) => {
    setUnits(currentUnits =>
      currentUnits.map(u => (u.id === updatedUnit.id ? updatedUnit : u))
    );
  }, []);

  const addUnit = useCallback(() => {
    setUnits(currentUnits => {
        const newId = currentUnits.length > 0 ? Math.max(...currentUnits.map(u => u.id)) + 1 : 1;
        const type: UnitType = Math.random() > 0.5 ? 'Vehicle' : 'Personnel';
        const name = `${names[type][Math.floor(Math.random() * names[type].length)]}-${newId}`;
        const newUnit: MeshUnit = {
            id: newId,
            name,
            type,
            status: 'Online',
            position: { lat: baseCoords.lat + (Math.random() - 0.5) * 0.02, lng: baseCoords.lng + (Math.random() - 0.5) * 0.02 },
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


  return { units, updateUnit, addUnit, removeUnit, chargeUnit, isInitialized };
}
