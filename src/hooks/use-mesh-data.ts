
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { MeshUnit, UnitType, Group, UnitHistoryPoint, UnitMessage, UnitStatus } from '@/types/mesh';
import { calculateBearing, calculateDistance } from '@/lib/utils';

const MESH_DATA_STORAGE_KEY = 'mesh-data-state';
const baseCoords = { lat: 53.19745, lng: 10.84507 };
const HISTORY_LIMIT = 300; // Store last 300 seconds (5 minutes) of data

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
    isExternallyPowered: false,
    lastMessage: null,
    groupId: 1,
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
    isExternallyPowered: false,
    lastMessage: null,
    groupId: 2,
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
    isExternallyPowered: false,
    lastMessage: null,
    groupId: 1,
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
    isExternallyPowered: false,
    lastMessage: null,
    groupId: 2,
  },
];

const initialGroups: Group[] = [
    { id: 1, name: "Fahrzeug-Gruppe" },
    { id: 2, name: "Angriffstrupp" }
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
  const [groups, setGroups] = useState<Group[]>([]);
  const [unitHistory, setUnitHistory] = useState<Record<number, UnitHistoryPoint[]>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  
  const unitsRef = useRef(units);
  unitsRef.current = units;
  const groupsRef = useRef(groups);
  groupsRef.current = groups;
  const unitHistoryRef = useRef(unitHistory);
  unitHistoryRef.current = unitHistory;

  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Refs to hold the latest values of props to avoid stale closures in setInterval
  const isRallyingRef = useRef(isRallying);
  const controlCenterPositionRef = useRef(controlCenterPosition);

  useEffect(() => {
    isRallyingRef.current = isRallying;
  }, [isRallying]);

  useEffect(() => {
    controlCenterPositionRef.current = controlCenterPosition;
  }, [controlCenterPosition]);

  useEffect(() => {
    let loadedState;
    try {
      const storedState = localStorage.getItem(MESH_DATA_STORAGE_KEY);
      if (storedState) {
        loadedState = JSON.parse(storedState);
      }
    } catch (error) {
      console.error("Failed to parse from localStorage", error);
    }
    
    setUnits(loadedState?.units && loadedState.units.length > 0 ? loadedState.units : initialUnits);
    setGroups(loadedState?.groups && loadedState.groups.length > 0 ? loadedState.groups : initialGroups);
    setUnitHistory(loadedState?.unitHistory || {});
    setIsInitialized(true);

    const handleBeforeUnload = () => {
      // Use refs to get the latest state, avoiding stale closures.
      if (unitsRef.current.length > 0) {
        try {
          const stateToSave = {
            units: unitsRef.current,
            groups: groupsRef.current,
            unitHistory: unitHistoryRef.current,
          };
          localStorage.setItem(MESH_DATA_STORAGE_KEY, JSON.stringify(stateToSave));
        } catch (error) {
          console.error("Failed to save state to localStorage", error);
        }
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const stopSimulation = useCallback(() => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
  }, []);

  const startSimulation = useCallback(() => {
    if (simulationIntervalRef.current) return;

    simulationIntervalRef.current = setInterval(() => {
      const messagesForToast: Array<{ unitName: string; message: string }> = [];
      const isRallyingMode = isRallyingRef.current && controlCenterPositionRef.current;
      const rallyPosition = controlCenterPositionRef.current;
      const now = Date.now();
      
      const nextUnits = unitsRef.current.map(unit => {
        if (!unit.isActive) {
          if (unit.status !== 'Offline') {
            return { ...unit, status: 'Offline' };
          }
          return unit;
        }

        const effectiveSendInterval = unit.isExternallyPowered ? 2 : unit.sendInterval;
        const timeSinceLastUpdate = (now - unit.timestamp) / 1000;

        if (timeSinceLastUpdate < effectiveSendInterval) {
          return unit;
        }
        
        let newBattery = unit.battery;
        if (unit.isExternallyPowered) {
          newBattery = Math.min(100, unit.battery + 0.5 * (timeSinceLastUpdate / 5)); // Charging logic
        } else {
          const batteryDrain = unit.battery > 0 ? 0.05 * (timeSinceLastUpdate / 5) : 0;
          newBattery = Math.max(0, unit.battery - batteryDrain);
        }

        let { lat, lng } = unit.position;
        let newHeading = unit.heading;
        let newSpeed = unit.speed;
        
        if (isRallyingMode && rallyPosition) {
          const distanceToCenter = calculateDistance(lat, lng, rallyPosition.lat, rallyPosition.lng);

          if (distanceToCenter > 0.5) {
            newHeading = calculateBearing(lat, lng, rallyPosition.lat, rallyPosition.lng);
             if (unit.type === 'Vehicle') {
                newSpeed = Math.max(10, Math.min(60, unit.speed + (Math.random() - 0.4) * 4)); 
              } else { 
                newSpeed = Math.max(2, Math.min(7, unit.speed + (Math.random() - 0.5) * 2));
              }
          } else {
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
        } else {
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
           const distance = (newSpeed / 3600) * timeSinceLastUpdate; 
           const angleRad = (newHeading * Math.PI) / 180;
           lat += (distance * Math.cos(angleRad)) / 111.32;
           lng += (distance * Math.sin(angleRad)) / (111.32 * Math.cos(lat * Math.PI / 180));
        }

        let newStatus = unit.status;
        if (newBattery === 0 && !unit.isExternallyPowered) {
          newStatus = 'Offline';
        } else if (newStatus !== 'Alarm' && newStatus !== 'Maintenance') {
          if (newSpeed > 1) newStatus = 'Moving';
          else newStatus = 'Idle';
        }
        
        let newLastMessage = unit.lastMessage;
        if (Math.random() < 0.005 && newStatus !== 'Offline') {
          const randomMessages = ["Alles in Ordnung.", "Benötige Status-Update.", "Position bestätigt.", "Verstanden."];
          const messageText = randomMessages[Math.floor(Math.random() * randomMessages.length)];
          newLastMessage = {
              text: messageText,
              timestamp: now,
              source: 'unit',
          };
          messagesForToast.push({ unitName: unit.name, message: messageText });
        }
        
        return {
            ...unit,
            position: { lat, lng },
            speed: parseFloat(newSpeed.toFixed(1)),
            heading: parseInt(newHeading.toFixed(0)),
            battery: parseFloat(newBattery.toFixed(2)),
            status: newStatus,
            isActive: newBattery > 0 || unit.isExternallyPowered,
            timestamp: now,
            lastMessage: newLastMessage,
        };
      });

      setUnits(nextUnits);
      
      setUnitHistory(prevHistory => {
        const newHistory = { ...prevHistory };
        nextUnits.forEach(unit => {
          if (!prevHistory[unit.id] || prevHistory[unit.id][0]?.timestamp !== unit.timestamp) {
            const currentUnitHistory = newHistory[unit.id] || [];
            const newHistoryPoint: UnitHistoryPoint = {
              position: unit.position,
              status: unit.status,
              timestamp: unit.timestamp,
              battery: unit.battery,
              lastMessage: unit.lastMessage,
            };
            newHistory[unit.id] = [newHistoryPoint, ...currentUnitHistory].slice(0, HISTORY_LIMIT);
          }
        });
        return newHistory;
      });
      
      messagesForToast.forEach(msg => {
        onUnitMessage(msg.unitName, msg.message);
      });
      
    }, 1000);
  }, [onUnitMessage]);

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
            isExternallyPowered: false,
            lastMessage: null,
            groupId: null,
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
  
  const sendMessage = useCallback((message: string, target: 'all' | number) => {
    setUnits(currentUnits => 
      currentUnits.map(unit => {
        const shouldReceive = target === 'all' || unit.groupId === target;
        if (unit.isActive && shouldReceive) {
          return {
            ...unit,
            lastMessage: {
              text: message,
              timestamp: Date.now(),
              source: 'control',
            }
          }
        }
        return unit;
      })
    )
  }, []);

  const setUnitStatus = useCallback((unitId: number, status: UnitStatus) => {
    setUnits(currentUnits => currentUnits.map(u => u.id === unitId ? { ...u, status } : u));
  }, []);

  const repositionAllUnits = useCallback((radiusKm: number) => {
    if (!controlCenterPositionRef.current) {
      console.warn("Cannot reposition units without a control center position.");
      return;
    }

    const { lat: centerLat, lng: centerLng } = controlCenterPositionRef.current;
    const earthRadiusKm = 6371;

    const toRadians = (deg: number) => deg * Math.PI / 180;
    const toDegrees = (rad: number) => rad * 180 / Math.PI;

    setUnits(currentUnits => currentUnits.map(unit => {
      // Generate a random point within the circle using a method that ensures uniform distribution
      const randomDist = radiusKm * Math.sqrt(Math.random());
      const randomAngle = Math.random() * 2 * Math.PI; // in radians

      const lat1Rad = toRadians(centerLat);
      const lon1Rad = toRadians(centerLng);
      const angularDistance = randomDist / earthRadiusKm;

      const newLatRad = Math.asin(
        Math.sin(lat1Rad) * Math.cos(angularDistance) +
        Math.cos(lat1Rad) * Math.sin(angularDistance) * Math.cos(randomAngle)
      );

      const newLonRad = lon1Rad + Math.atan2(
        Math.sin(randomAngle) * Math.sin(angularDistance) * Math.cos(lat1Rad),
        Math.cos(angularDistance) - Math.sin(lat1Rad) * Math.sin(newLatRad)
      );
      
      return {
        ...unit,
        position: {
          lat: toDegrees(newLatRad),
          lng: toDegrees(newLonRad)
        },
        speed: 0,
        heading: Math.floor(Math.random() * 360),
        status: 'Online',
        timestamp: Date.now()
      };
    }));
  }, []);

  const addGroup = (name: string) => {
    setGroups(g => [...g, { id: Date.now(), name }]);
  };

  const updateGroup = (updatedGroup: Group) => {
    setGroups(g => g.map(group => group.id === updatedGroup.id ? updatedGroup : group));
  };
  
  const removeGroup = (groupId: number) => {
    setGroups(g => g.filter(group => group.id !== groupId));
    // Also unassign units from this group
    setUnits(u => u.map(unit => unit.groupId === groupId ? { ...unit, groupId: null } : unit));
  };

  const assignUnitToGroup = (unitId: number, groupId: number | null) => {
    setUnits(u => u.map(unit => unit.id === unitId ? { ...unit, groupId } : unit));
  };


  return { 
      units, 
      updateUnit, 
      addUnit, 
      removeUnit, 
      chargeUnit, 
      isInitialized, 
      sendMessage, 
      startSimulation, 
      stopSimulation,
      unitHistory,
      groups,
      addGroup,
      updateGroup,
      removeGroup,
      assignUnitToGroup,
      repositionAllUnits,
      setUnitStatus,
    };
}
