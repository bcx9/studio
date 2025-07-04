'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { MeshUnit, UnitType } from '@/types/mesh';
import { calculateBearing, calculateDistance } from '@/lib/utils';

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
    lastMessage: null,
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
    lastMessage: null,
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
    lastMessage: null,
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
    lastMessage: null,
  },
];

const names: Record<UnitType, string[]> = {
    Vehicle: ['RTW', 'NEF', 'GW-L', 'DLK-23', 'TSF-W'],
    Personnel: ['GF', 'ZF', 'MA', 'SAN', 'PA-1', 'PA-2'],
}

interface UseMeshDataProps {
  onUnitMessage: (unitName: string, message: string) => void;
  isRallying: boolean;
  controlCenterPosition: { lat: number; lng: number } | null;
}


export function useMeshData({ onUnitMessage, isRallying, controlCenterPosition }: UseMeshDataProps) {
  const [units, setUnits] = useState<MeshUnit[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const unitsRef = useRef(units);
  unitsRef.current = units;
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // This effect should only run once on the client after hydration
    let loadedUnits: MeshUnit[] = [];
    try {
      const storedState = localStorage.getItem(MESH_DATA_STORAGE_KEY);
      if (storedState) {
        const parsedUnits = JSON.parse(storedState) as MeshUnit[];
        // Filter out any invalid units from storage
        if(Array.isArray(parsedUnits) && parsedUnits.length > 0) {
            loadedUnits = parsedUnits;
        } else {
            loadedUnits = initialUnits;
        }
      } else {
        loadedUnits = initialUnits;
      }
    } catch (error) {
      console.error("Failed to load units from localStorage, using initial data.", error);
      loadedUnits = initialUnits;
    }
    setUnits(loadedUnits);
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

  const stopSimulation = useCallback(() => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
  }, []);

  const startSimulation = useCallback(() => {
    if (simulationIntervalRef.current) return; // Already running

    simulationIntervalRef.current = setInterval(() => {
      const messagesToSend: Array<{ unitName: string; message: string }> = [];
      const isRallyingMode = isRallying && controlCenterPosition;
      
      const nextUnits = unitsRef.current.map(unit => {
        if (!unit.isActive) {
          return {...unit, status: 'Offline'};
        }

        const batteryDrain = unit.battery > 0 ? 0.05 / (unit.sendInterval / 5) : 0;
        const newBattery = Math.max(0, unit.battery - batteryDrain);

        let { lat, lng } = unit.position;
        let newHeading = unit.heading;
        let newSpeed = unit.speed;
        
        if (isRallyingMode) {
          const distanceToCenter = calculateDistance(lat, lng, controlCenterPosition.lat, controlCenterPosition.lng);

          if (distanceToCenter > 0.5) { // more than 500m away
            newHeading = calculateBearing(lat, lng, controlCenterPosition.lat, controlCenterPosition.lng);
             if (unit.type === 'Vehicle') {
                newSpeed = Math.max(10, Math.min(60, unit.speed + (Math.random() - 0.4) * 4)); 
              } else { 
                newSpeed = Math.max(2, Math.min(7, unit.speed + (Math.random() - 0.5) * 2));
              }
          } else { // within 500m radius, patrol
             if (unit.type === 'Vehicle') {
                newSpeed = Math.max(0, Math.min(15, unit.speed + (Math.random() - 0.5) * 4)); 
                 if (newSpeed > 1) {
                    newHeading = (unit.heading + (Math.random() - 0.5) * 25) % 360; 
                }
            } else { 
                newSpeed = Math.max(0, Math.min(5, unit.speed + (Math.random() - 0.5) * 2));
                if (newSpeed > 0.5) {
                    newHeading = (unit.heading + (Math.random() - 0.5) * 60) % 360;
                }
            }
          }
        } else { // Regular movement
            if (unit.type === 'Vehicle') {
              newSpeed = Math.max(0, Math.min(60, unit.speed + (Math.random() - 0.4) * 4)); 
              if (newSpeed > 1) {
                newHeading = (unit.heading + (Math.random() - 0.5) * 10) % 360; 
              }
            } else { 
              newSpeed = Math.max(0, Math.min(7, unit.speed + (Math.random() - 0.5) * 2)); 
              if (newSpeed > 0.5) {
                newHeading = (unit.heading + (Math.random() - 0.5) * 45) % 360;
              }
            }
        }

        if (newSpeed > 1) {
           const distance = (newSpeed / 3600) * 1; 
           const angleRad = (newHeading * Math.PI) / 180;
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

        // Simulate a unit sending a message back to the control center
        if (Math.random() < 0.005 && newStatus !== 'Offline') { // ~once every 200s per active unit
          const randomMessages = ["Alles in Ordnung.", "Benötige Status-Update.", "Position bestätigt.", "Verstanden."];
          const messageText = randomMessages[Math.floor(Math.random() * randomMessages.length)];
          messagesToSend.push({ unitName: unit.name, message: messageText });
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
      });

      setUnits(nextUnits);

      messagesToSend.forEach(msg => {
        onUnitMessage(msg.unitName, msg.message);
      });
      
    }, 1000);
  }, [onUnitMessage, isRallying, controlCenterPosition]);

  useEffect(() => {
    // Cleanup simulation on component unmount
    return () => stopSimulation();
  }, [stopSimulation]);


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
            lastMessage: null,
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

  const sendMessageToAllUnits = useCallback((message: string) => {
    setUnits(currentUnits => 
      currentUnits.map(unit => {
        if (unit.isActive) {
          return {
            ...unit,
            lastMessage: {
              text: message,
              timestamp: Date.now(),
            }
          }
        }
        return unit;
      })
    )
  }, []);


  return { units, updateUnit, addUnit, removeUnit, chargeUnit, isInitialized, sendMessageToAllUnits, startSimulation, stopSimulation };
}
