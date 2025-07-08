
'use server';

import type { MeshUnit, Group, TypeMapping, StatusMapping, UnitType, ToastMessage, Assignment } from '@/types/mesh';
import { DEFAULT_CODE_TO_UNIT_TYPE, DEFAULT_CODE_TO_UNIT_STATUS } from '@/types/mesh';
import { calculateBearing, calculateDistance, createReverseMapping } from '@/lib/utils';

const baseCoords = { lat: 53.19745, lng: 10.84507 };

const initialUnits: MeshUnit[] = [
  { id: 1, name: 'HLF-20', type: 'Vehicle', status: 'Online', position: { lat: baseCoords.lat + (Math.random() - 0.5) * 0.02, lng: baseCoords.lng + (Math.random() - 0.5) * 0.02 }, speed: 0, heading: 45, battery: 95, timestamp: Date.now(), sendInterval: 5, isActive: true, isExternallyPowered: false, lastMessage: null, groupId: 1, signalStrength: -65, hopCount: 1, patrolTarget: null, patrolTargetIndex: null },
  { id: 2, name: 'AT-1', type: 'Personnel', status: 'Online', position: { lat: baseCoords.lat + (Math.random() - 0.5) * 0.02, lng: baseCoords.lng + (Math.random() - 0.5) * 0.02 }, speed: 3, heading: 180, battery: 88, timestamp: Date.now(), sendInterval: 10, isActive: true, isExternallyPowered: false, lastMessage: null, groupId: 2, signalStrength: -82, hopCount: 2, patrolTarget: null, patrolTargetIndex: null },
  { id: 3, name: 'ELW-1', type: 'Vehicle', status: 'Alarm', position: { lat: baseCoords.lat + (Math.random() - 0.5) * 0.02, lng: baseCoords.lng + (Math.random() - 0.5) * 0.02 }, speed: 0, heading: 270, battery: 15, timestamp: Date.now(), sendInterval: 5, isActive: true, isExternallyPowered: false, lastMessage: null, groupId: 1, signalStrength: -71, hopCount: 1, patrolTarget: null, patrolTargetIndex: null },
  { id: 4, name: 'AT-2', type: 'Personnel', status: 'Offline', position: { lat: baseCoords.lat + (Math.random() - 0.5) * 0.02, lng: baseCoords.lng + (Math.random() - 0.5) * 0.02 }, speed: 0, heading: 0, battery: 0, timestamp: Date.now() - 600000, sendInterval: 30, isActive: false, isExternallyPowered: false, lastMessage: null, groupId: 2, signalStrength: -120, hopCount: 0, patrolTarget: null, patrolTargetIndex: null },
  { id: 5, name: 'DLK-23', type: 'Vehicle', status: 'Idle', position: { lat: baseCoords.lat + (Math.random() - 0.5) * 0.02, lng: baseCoords.lng + (Math.random() - 0.5) * 0.02 }, speed: 0, heading: 90, battery: 100, timestamp: Date.now(), sendInterval: 8, isActive: true, isExternallyPowered: true, lastMessage: null, groupId: 1, signalStrength: -68, hopCount: 1, patrolTarget: null, patrolTargetIndex: null },
  { id: 6, name: 'RTW', type: 'Vehicle', status: 'Moving', position: { lat: baseCoords.lat + (Math.random() - 0.5) * 0.02, lng: baseCoords.lng + (Math.random() - 0.5) * 0.02 }, speed: 45, heading: 120, battery: 75, timestamp: Date.now(), sendInterval: 5, isActive: true, isExternallyPowered: false, lastMessage: null, groupId: 3, signalStrength: -75, hopCount: 1, patrolTarget: null, patrolTargetIndex: null },
  { id: 7, name: 'NEF', type: 'Vehicle', status: 'Moving', position: { lat: baseCoords.lat + (Math.random() - 0.5) * 0.02, lng: baseCoords.lng + (Math.random() - 0.5) * 0.02 }, speed: 70, heading: 110, battery: 80, timestamp: Date.now(), sendInterval: 5, isActive: true, isExternallyPowered: false, lastMessage: null, groupId: 3, signalStrength: -80, hopCount: 2, patrolTarget: null, patrolTargetIndex: null },
  { id: 8, name: 'MTF', type: 'Vehicle', status: 'Idle', position: { lat: baseCoords.lat + (Math.random() - 0.5) * 0.02, lng: baseCoords.lng + (Math.random() - 0.5) * 0.02 }, speed: 0, heading: 300, battery: 90, timestamp: Date.now(), sendInterval: 15, isActive: true, isExternallyPowered: false, lastMessage: null, groupId: 1, signalStrength: -88, hopCount: 2, patrolTarget: null, patrolTargetIndex: null },
  { id: 9, name: 'Wassertrupp', type: 'Support', status: 'Online', position: { lat: baseCoords.lat + (Math.random() - 0.5) * 0.02, lng: baseCoords.lng + (Math.random() - 0.5) * 0.02 }, speed: 2, heading: 210, battery: 92, timestamp: Date.now(), sendInterval: 10, isActive: true, isExternallyPowered: false, lastMessage: null, groupId: 2, signalStrength: -91, hopCount: 3, patrolTarget: null, patrolTargetIndex: null },
  { id: 10, name: 'Einsatzleiter', type: 'Personnel', status: 'Online', position: { lat: baseCoords.lat + (Math.random() - 0.5) * 0.02, lng: baseCoords.lng + (Math.random() - 0.5) * 0.02 }, speed: 1, heading: 0, battery: 98, timestamp: Date.now(), sendInterval: 10, isActive: true, isExternallyPowered: false, lastMessage: null, groupId: 1, signalStrength: -60, hopCount: 1, patrolTarget: null, patrolTargetIndex: null },
];

const initialGroups: Group[] = [
    { id: 1, name: "Führung & Löschfahrzeuge" },
    { id: 2, name: "Mannschaft" },
    { id: 3, name: "Rettungsdienst" }
];

interface ServerState {
    units: MeshUnit[];
    groups: Group[];
    typeMapping: TypeMapping;
    statusMapping: StatusMapping;
    assignments: Assignment[];
    simulationInterval: NodeJS.Timeout | null;
    isRallying: boolean;
    controlCenterPosition: { lat: number, lng: number } | null;
    messages: ToastMessage[];
}

// This is our in-memory "database" on the server.
// It must be 'let' to allow for immutable updates.
let state: ServerState = {
    units: initialUnits,
    groups: initialGroups,
    typeMapping: DEFAULT_CODE_TO_UNIT_TYPE,
    statusMapping: DEFAULT_CODE_TO_UNIT_STATUS,
    assignments: [],
    simulationInterval: null,
    isRallying: false,
    controlCenterPosition: { lat: 53.19745, lng: 10.84507 },
    messages: []
};

export async function startSimulation() {
    if (state.simulationInterval) return;

    const intervalId = setInterval(() => {
        const now = Date.now();
        const timeDelta = 0.25; // Simulation runs every 250ms
        
        // --- Pre-calculation for Group Cohesion & Alarm Response ---
        const alarmUnits = state.units.filter(u => u.status === 'Alarm' && u.isActive);
        const otherUnits = state.units.filter(u => u.status !== 'Alarm' && u.isActive);
        const responderTargetMap = new Map<number, MeshUnit>();
        const groupCenterMap = new Map<number, { lat: number, lng: number }>();

        if (alarmUnits.length > 0 && otherUnits.length > 0) {
            alarmUnits.forEach(alarmUnit => {
                const unitsByDistance = otherUnits
                    .filter(ou => !responderTargetMap.has(ou.id)) // Ensure a unit only responds to one alarm
                    .map(otherUnit => ({
                        unit: otherUnit,
                        distance: calculateDistance(
                            alarmUnit.position.lat, alarmUnit.position.lng,
                            otherUnit.position.lat, otherUnit.position.lng
                        ),
                    }))
                    .sort((a, b) => a.distance - b.distance);
                
                const responders = unitsByDistance.slice(0, 3);
                responders.forEach(responder => {
                    responderTargetMap.set(responder.unit.id, alarmUnit);
                });
            });
        }
        
        state.groups.forEach(group => {
            const unitsInGroup = state.units.filter(u => u.groupId === group.id && u.isActive);
            if (unitsInGroup.length > 1) {
                const totalLat = unitsInGroup.reduce((sum, u) => sum + u.position.lat, 0);
                const totalLng = unitsInGroup.reduce((sum, u) => sum + u.position.lng, 0);
                groupCenterMap.set(group.id, { lat: totalLat / unitsInGroup.length, lng: totalLng / unitsInGroup.length });
            }
        });

        // --- Unit Update Loop ---
        let updatedUnits = state.units.map(unit => {
            let newUnitState = { ...unit };

            if (!newUnitState.isActive) {
                if (newUnitState.status !== 'Offline') {
                    newUnitState.status = 'Offline';
                    newUnitState.signalStrength = -120;
                    newUnitState.hopCount = 0;
                }
                return newUnitState;
            }

            // --- MOVEMENT LOGIC (runs every tick) ---
            let { lat, lng } = newUnitState.position;
            
            let targetPosition: { lat: number; lng: number } | null = null;
            
            const maxSpeed = (() => {
                switch(newUnitState.type) {
                    case 'Vehicle': case 'Military': case 'Police': return 80;
                    case 'Air': return 300;
                    case 'Personnel': case 'Support': return 5;
                    default: return 5;
                }
            })();
            
            // Determine Target Position based on a clear priority
            const alarmResponseTarget = responderTargetMap.get(newUnitState.id);
            const assignment = state.assignments.find(a => a.groupId === newUnitState.groupId);
            const groupCenter = newUnitState.groupId ? groupCenterMap.get(newUnitState.groupId) : null;

            // Priority 1: Respond to Alarm
            if (alarmResponseTarget) {
                targetPosition = alarmResponseTarget.position;
            }
            // Priority 2: Rally to Control Center
            else if (state.isRallying && state.controlCenterPosition) {
                targetPosition = state.controlCenterPosition;
            }
            // Priority 3: Follow Assignment (Patrol/Pendulum)
            else if (assignment) {
                if (assignment.type === 'patrol') {
                    const { target: patrolCenter, radius } = assignment;
                    const distanceToCenter = calculateDistance(lat, lng, patrolCenter.lat, patrolCenter.lng);

                    if (distanceToCenter > radius) {
                        targetPosition = patrolCenter;
                    } else {
                        if (!newUnitState.patrolTarget || calculateDistance(lat, lng, newUnitState.patrolTarget.lat, newUnitState.patrolTarget.lng) < 0.2) {
                            const randomAngle = Math.random() * 2 * Math.PI;
                            const randomRadius = radius * Math.sqrt(Math.random());
                            const earthRadiusKm = 6371;
                            const latRad = patrolCenter.lat * Math.PI / 180;
                            const lonRad = patrolCenter.lng * Math.PI / 180;
                            const newLatRad = Math.asin(Math.sin(latRad) * Math.cos(randomRadius / earthRadiusKm) + Math.cos(latRad) * Math.sin(randomRadius / earthRadiusKm) * Math.cos(randomAngle));
                            const newLonRad = lonRad + Math.atan2(Math.sin(randomAngle) * Math.sin(randomRadius / earthRadiusKm) * Math.cos(latRad), Math.cos(randomRadius / earthRadiusKm) - Math.sin(latRad) * Math.sin(newLatRad));
                            newUnitState.patrolTarget = { lat: newLatRad * 180 / Math.PI, lng: newLonRad * 180 / Math.PI };
                        }
                        targetPosition = newUnitState.patrolTarget;
                    }
                } else if (assignment.type === 'pendulum') {
                    if (newUnitState.patrolTargetIndex === null || newUnitState.patrolTargetIndex >= assignment.points.length) {
                        newUnitState.patrolTargetIndex = 0;
                    }
                    let currentPendulumTarget = assignment.points[newUnitState.patrolTargetIndex];
                    if (calculateDistance(lat, lng, currentPendulumTarget.lat, currentPendulumTarget.lng) < 0.1) {
                        newUnitState.patrolTargetIndex = (newUnitState.patrolTargetIndex + 1) % assignment.points.length;
                    }
                    targetPosition = assignment.points[newUnitState.patrolTargetIndex];
                }
            }
            // Priority 4: Group Cohesion
            else if (groupCenter) {
                const distanceToGroupCenter = calculateDistance(lat, lng, groupCenter.lat, groupCenter.lng);
                if (distanceToGroupCenter > 1.0) {
                    targetPosition = groupCenter;
                }
            }
            
            // --- Update Position and Speed based on Target ---
            if (targetPosition) {
                const distanceToTarget = calculateDistance(lat, lng, targetPosition.lat, targetPosition.lng);
                const stopDistance = (targetPosition === state.controlCenterPosition) ? 0.5 : 0.1;

                if (distanceToTarget > stopDistance) {
                    newUnitState.heading = calculateBearing(lat, lng, targetPosition.lat, targetPosition.lng);
                    newUnitState.speed = maxSpeed;
                } else {
                    newUnitState.speed = 0;
                }
            } else {
                newUnitState.speed = 0;
            }

            const distanceMoved = (newUnitState.speed / 3600) * timeDelta;
            if (distanceMoved > 0) {
                const angleRad = (newUnitState.heading * Math.PI) / 180;
                const cosLat = Math.cos(lat * Math.PI / 180);
                
                if (Math.abs(cosLat) > 1e-9) {
                    lat += (distanceMoved * Math.cos(angleRad)) / 111.32;
                    lng += (distanceMoved * Math.sin(angleRad)) / (111.32 * cosLat);
                }

                lat = Math.max(-90, Math.min(90, lat));
                lng = (lng + 540) % 360 - 180;
                newUnitState.position = { lat, lng };
            }


            // --- INFREQUENT UPDATES (runs based on sendInterval) ---
            const timeSinceLastUpdate = (now - newUnitState.timestamp) / 1000;
            const effectiveSendInterval = newUnitState.isExternallyPowered ? 2 : newUnitState.sendInterval;

            if (timeSinceLastUpdate >= effectiveSendInterval) {
                newUnitState.timestamp = now;
                if (newUnitState.isExternallyPowered) {
                    newUnitState.battery = Math.min(100, newUnitState.battery + 2 * (timeSinceLastUpdate / 5));
                } else {
                    const batteryDrain = newUnitState.battery > 0 ? 0.05 * (timeSinceLastUpdate / 5) : 0;
                    newUnitState.battery = Math.max(0, newUnitState.battery - batteryDrain);
                }
                if (Math.random() < 0.02) {
                    const randomMessages = ["Alles in Ordnung.", "Benötige Status-Update.", "Position bestätigt.", "Verstanden."];
                    const messageText = randomMessages[Math.floor(Math.random() * randomMessages.length)];
                    newUnitState.lastMessage = { text: messageText, timestamp: now, source: 'unit' };
                    state.messages.push({ unitName: newUnitState.name, text: messageText });
                }
            }

            // --- STATUS UPDATE (runs every tick) ---
            if (newUnitState.battery <= 0 && !newUnitState.isExternallyPowered) {
                newUnitState.status = 'Offline';
                newUnitState.isActive = false;
            } else if (newUnitState.status !== 'Alarm' && newUnitState.status !== 'Maintenance') {
                newUnitState.status = newUnitState.speed > 1 ? 'Moving' : 'Idle';
            }
            newUnitState.battery = parseFloat(newUnitState.battery.toFixed(2));
            
            return newUnitState;
        });
        
        // Step 2: Simulate mesh network topology (hops and signal strength)
        if (state.controlCenterPosition) {
            const gatewayPos = state.controlCenterPosition;
            const MAX_RANGE_KM = 3; // Max range between any two nodes or node-to-gateway

            // Initialize all active units for topology calculation
            updatedUnits.forEach(unit => {
                if (unit.isActive) {
                    unit.hopCount = Infinity;
                    unit.signalStrength = -120;
                } else {
                    unit.hopCount = 0;
                    unit.signalStrength = -120;
                    unit.status = 'Offline';
                }
            });

            // Pass 1: Connect units directly to the gateway
            updatedUnits.forEach(unit => {
                if (unit.isActive) {
                    const distToGateway = calculateDistance(unit.position.lat, unit.position.lng, gatewayPos.lat, gatewayPos.lng);
                    if (distToGateway <= MAX_RANGE_KM) {
                        unit.hopCount = 1;
                        // Signal strength degrades with distance. -50 is excellent, -110 is poor.
                        unit.signalStrength = Math.round(Math.max(-120, -50 - (distToGateway * 20))); 
                    }
                }
            });

            // Iteratively connect remaining units to the mesh
            let connectionsMadeInLastPass = true;
            while (connectionsMadeInLastPass) {
                connectionsMadeInLastPass = false;
                updatedUnits.forEach(childUnit => {
                    // If this unit is already connected or inactive, skip it
                    if (!childUnit.isActive || childUnit.hopCount !== Infinity) {
                        return;
                    }

                    let bestParent: MeshUnit | null = null;
                    let minHops = Infinity;
                    let bestSignal = -Infinity;

                    // Find the best potential parent
                    updatedUnits.forEach(potentialParent => {
                        // A valid parent must be active and already part of the mesh
                        if (potentialParent.isActive && potentialParent.hopCount !== Infinity && potentialParent.id !== childUnit.id) {
                             const distance = calculateDistance(
                                childUnit.position.lat, childUnit.position.lng,
                                potentialParent.position.lat, potentialParent.position.lng
                            );

                            if (distance < MAX_RANGE_KM) {
                                // Prefer parent with fewer hops, then better signal
                                if (potentialParent.hopCount < minHops) {
                                    minHops = potentialParent.hopCount;
                                    bestSignal = potentialParent.signalStrength;
                                    bestParent = potentialParent;
                                } else if (potentialParent.hopCount === minHops) {
                                    if(potentialParent.signalStrength > bestSignal) {
                                         bestSignal = potentialParent.signalStrength;
                                         bestParent = potentialParent;
                                    }
                                }
                            }
                        }
                    });

                    // If a suitable parent was found, connect the child
                    if (bestParent) {
                        const distanceToParent = calculateDistance(childUnit.position.lat, childUnit.position.lng, bestParent.position.lat, bestParent.position.lng);
                        childUnit.hopCount = bestParent.hopCount + 1;
                        childUnit.signalStrength = Math.round(Math.max(-120, -50 - (distanceToParent * 20)));
                        connectionsMadeInLastPass = true;
                    }
                });
            }

            // Final cleanup: Any unit that couldn't connect is now offline
            updatedUnits.forEach(unit => {
                if (unit.hopCount === Infinity) {
                    unit.hopCount = 0;
                    unit.status = 'Offline';
                    unit.isActive = false;
                }
            });
        }
        
        state = { ...state, units: updatedUnits };
    }, 250);

    state = { ...state, simulationInterval: intervalId };
}

export async function stopSimulation() {
    if (state.simulationInterval) {
        clearInterval(state.simulationInterval);
        state = { ...state, simulationInterval: null };
    }
}

export async function getSnapshot() {
    const messages = [...state.messages];
    state = { ...state, messages: [] };
    return { 
        units: state.units, 
        groups: state.groups,
        messages,
        typeMapping: state.typeMapping,
        statusMapping: state.statusMapping,
        assignments: state.assignments,
    };
}

export async function getConfig() {
    return {
        units: state.units,
        groups: state.groups,
        typeMapping: state.typeMapping,
        statusMapping: state.statusMapping
    }
}

export async function updateConfig({ typeMapping, statusMapping }: { typeMapping: TypeMapping, statusMapping: StatusMapping }) {
    state = { ...state, typeMapping, statusMapping };
}

export async function updateUnit(updatedUnit: MeshUnit) {
    state = {
        ...state,
        units: state.units.map(u => u.id === updatedUnit.id ? updatedUnit : u),
    };
}

export async function addUnit() {
    const newId = state.units.length > 0 ? Math.max(...state.units.map(u => u.id)) + 1 : 1;
    const availableTypes = Object.values(state.typeMapping) as UnitType[];
    const type = availableTypes.length > 0 ? availableTypes[Math.floor(Math.random() * availableTypes.length)] : 'Support';
    
    const name = `${type}-${newId}`;
    const newUnit: MeshUnit = { id: newId, name, type, status: 'Online', position: { lat: baseCoords.lat + (Math.random() - 0.5) * 0.02, lng: baseCoords.lng + (Math.random() - 0.5) * 0.02 }, speed: 0, heading: Math.floor(Math.random() * 360), battery: 100, timestamp: Date.now(), sendInterval: 10, isActive: true, isExternallyPowered: false, lastMessage: null, groupId: null, signalStrength: -75, hopCount: 1, patrolTarget: null, patrolTargetIndex: null };
    state = { ...state, units: [...state.units, newUnit] };
}

export async function removeUnit(unitId: number) {
    state = {
        ...state,
        units: state.units.filter(u => u.id !== unitId),
    };
}

export async function chargeUnit(unitId: number) {
    state = {
        ...state,
        units: state.units.map(u => u.id === unitId ? { ...u, battery: 100, status: u.status === 'Offline' ? 'Online' : u.status, isActive: true } : u),
    };
}

export async function sendMessage(message: string, target: 'all' | number) {
    state = {
        ...state,
        units: state.units.map(unit => {
            const shouldReceive = target === 'all' || unit.groupId === target;
            if (unit.isActive && shouldReceive) {
                return { ...unit, lastMessage: { text: message, timestamp: Date.now(), source: 'control' } };
            }
            return unit;
        }),
    };
}

export async function repositionAllUnits(radiusKm: number) {
    if (!state.controlCenterPosition) return;
    const { lat: centerLat, lng: centerLng } = state.controlCenterPosition;
    const earthRadiusKm = 6371;
    const toRadians = (deg: number) => deg * Math.PI / 180;
    const toDegrees = (rad: number) => rad * 180 / Math.PI;

    const newUnits = state.units.map(unit => {
        const randomDist = radiusKm * Math.sqrt(Math.random());
        const randomAngle = Math.random() * 2 * Math.PI;
        const lat1Rad = toRadians(centerLat);
        const lon1Rad = toRadians(centerLng);
        const angularDistance = randomDist / earthRadiusKm;
        const newLatRad = Math.asin(Math.sin(lat1Rad) * Math.cos(angularDistance) + Math.cos(lat1Rad) * Math.sin(angularDistance) * Math.cos(randomAngle));
        let newLonRad;
        if (Math.abs(Math.cos(lat1Rad)) < 1e-9) { // Handle poles
            newLonRad = lon1Rad;
        } else {
            newLonRad = lon1Rad + Math.atan2(Math.sin(randomAngle) * Math.sin(angularDistance) * Math.cos(lat1Rad), Math.cos(angularDistance) - Math.sin(lat1Rad) * Math.sin(newLatRad));
        }

        return { ...unit, position: { lat: toDegrees(newLatRad), lng: toDegrees(newLonRad) }, speed: 0, heading: Math.floor(Math.random() * 360), status: 'Online', timestamp: Date.now() };
    });
    state = { ...state, units: newUnits };
}

export async function addGroup(name: string) {
    const newGroup = { id: Date.now(), name };
    state = { ...state, groups: [...state.groups, newGroup] };
}

export async function updateGroup(updatedGroup: Group) {
    state = {
        ...state,
        groups: state.groups.map(g => g.id === updatedGroup.id ? updatedGroup : g),
    };
}

export async function removeGroup(groupId: number) {
    state = {
        ...state,
        groups: state.groups.filter(g => g.id !== groupId),
        units: state.units.map(u => u.groupId === groupId ? { ...u, groupId: null, patrolTarget: null, patrolTargetIndex: null } : u),
        assignments: state.assignments.filter(p => p.groupId !== groupId),
    };
}

export async function assignUnitToGroup(unitId: number, groupId: number | null) {
    state = {
        ...state,
        units: state.units.map(u => u.id === unitId ? { ...u, groupId } : u),
    };
}

export async function assignPatrolToGroup(groupId: number, target: { lat: number, lng: number }, radius: number) {
    const newAssignment: Assignment = { type: 'patrol', groupId, target, radius };
    const otherAssignments = state.assignments.filter(p => p.groupId !== groupId);
    state = {
        ...state,
        assignments: [...otherAssignments, newAssignment],
        units: state.units.map(u => u.groupId === groupId ? { ...u, patrolTarget: null, patrolTargetIndex: null } : u),
    };
}


export async function assignPendulumToGroup(groupId: number, points: { lat: number, lng: number }[]) {
    const newAssignment: Assignment = { type: 'pendulum', groupId, points };
    const otherAssignments = state.assignments.filter(p => p.groupId !== groupId);
    state = {
        ...state,
        assignments: [...otherAssignments, newAssignment],
        units: state.units.map(u => u.groupId === groupId ? { ...u, patrolTarget: null, patrolTargetIndex: 0 } : u),
    };
}

export async function removeAssignmentFromGroup(groupId: number) {
     state = {
        ...state,
        assignments: state.assignments.filter(p => p.groupId !== groupId),
        units: state.units.map(u => u.groupId === groupId ? { ...u, patrolTarget: null, patrolTargetIndex: null } : u),
    };
}

export async function isSimulationRunning(): Promise<boolean> {
    return state.simulationInterval !== null;
}

export async function addTypeMapping(id: number, name: string) {
    if (state.typeMapping[id]) {
        throw new Error(`Die Typ-ID ${id} existiert bereits.`);
    }
    state = { ...state, typeMapping: { ...state.typeMapping, [id]: name } };
}

export async function removeTypeMapping(id: number) {
    const typeName = state.typeMapping[id];
    if (!typeName) return;

    const unitsUsingType = state.units.filter(u => u.type === typeName);

    if (unitsUsingType.length > 0) {
        throw new Error(`Der Typ "${typeName}" wird noch von ${unitsUsingType.length} Einheit(en) verwendet und kann nicht gelöscht werden.`);
    }
    
    const newMapping = { ...state.typeMapping };
    delete newMapping[id];
    state = { ...state, typeMapping: newMapping };
}

export async function addStatusMapping(id: number, name: string) {
    if (state.statusMapping[id]) {
        throw new Error(`Die Status-ID ${id} existiert bereits.`);
    }
    state = { ...state, statusMapping: { ...state.statusMapping, [id]: name } };
}

export async function removeStatusMapping(id: number) {
    const statusName = state.statusMapping[id];
    if (!statusName) return;
    
    const unitsUsingStatus = state.units.filter(u => u.status === statusName);

    if (unitsUsingStatus.length > 0) {
        throw new Error(`Der Status "${statusName}" wird noch von ${unitsUsingStatus.length} Einheit(en) verwendet und kann nicht gelöscht werden.`);
    }
    
    const newMapping = { ...state.statusMapping };
    delete newMapping[id];
    state = { ...state, statusMapping: newMapping };
}

export async function setRallying(isRallying: boolean) {
    state = { ...state, isRallying };
}

export async function setControlCenterPosition(position: { lat: number; lng: number } | null) {
    state = { ...state, controlCenterPosition: position };
}
