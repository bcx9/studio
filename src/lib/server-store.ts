
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

export function startSimulation() {
    if (state.simulationInterval) return;

    const intervalId = setInterval(() => {
        const isRallyingMode = state.isRallying && state.controlCenterPosition;
        const rallyPosition = state.controlCenterPosition;
        const now = Date.now();
        
        // --- Pre-calculation for Group Cohesion & Alarm Response ---
        const alarmUnits = state.units.filter(u => u.status === 'Alarm' && u.isActive);
        const otherUnits = state.units.filter(u => u.status !== 'Alarm' && u.isActive);
        const responderTargetMap = new Map<number, MeshUnit>();
        const groupCenterMap = new Map<number, { lat: number, lng: number }>();

        // Find responders for alarms
        if (alarmUnits.length > 0 && otherUnits.length > 0) {
            alarmUnits.forEach(alarmUnit => {
                const unitsByDistance = otherUnits
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
        
        // Calculate group centers for cohesion
        state.groups.forEach(group => {
            const unitsInGroup = state.units.filter(u => u.groupId === group.id && u.isActive);
            if (unitsInGroup.length > 1) {
                const totalLat = unitsInGroup.reduce((sum, u) => sum + u.position.lat, 0);
                const totalLng = unitsInGroup.reduce((sum, u) => sum + u.position.lng, 0);
                groupCenterMap.set(group.id, { lat: totalLat / unitsInGroup.length, lng: totalLng / unitsInGroup.length });
            }
        });
        // --- End of Pre-calculation ---


        // Step 1: Update individual unit properties (movement, battery, etc.)
        let updatedUnits = state.units.map(unit => {
            if (!unit.isActive) {
                if (unit.status !== 'Offline') {
                    return { ...unit, status: 'Offline', signalStrength: -120, hopCount: 0 };
                }
                return unit;
            }

            const effectiveSendInterval = unit.isExternallyPowered ? 2 : unit.sendInterval;
            const timeSinceLastUpdate = (now - unit.timestamp) / 1000;

            if (timeSinceLastUpdate < effectiveSendInterval) {
                return unit; // Not time to update this unit yet
            }
            
            let newBattery = unit.battery;
            if (unit.isExternallyPowered) {
                newBattery = Math.min(100, unit.battery + 0.5 * (timeSinceLastUpdate / 5));
            } else {
                const batteryDrain = unit.battery > 0 ? 0.05 * (timeSinceLastUpdate / 5) : 0;
                newBattery = Math.max(0, unit.battery - batteryDrain);
            }

            let { lat, lng } = unit.position;
            let newHeading = unit.heading;
            let newSpeed = unit.speed;
            
            let targetPosition: { lat: number; lng: number } | null = null;
            let targetSpeed = 0; // Default to stopping
            let newPatrolTarget = unit.patrolTarget;
            let newPatrolTargetIndex = unit.patrolTargetIndex;

            const responseTarget = responderTargetMap.get(unit.id);
            const groupCenter = unit.groupId ? groupCenterMap.get(unit.groupId) : null;
            const assignment = state.assignments.find(a => a.groupId === unit.groupId);
            
            // --- Movement Logic ---
            // Priority: 1. Rallying, 2. Alarm Response, 3. Patrol/Pendulum, 4. Group Cohesion, 5. Default
            if (isRallyingMode && rallyPosition) {
                targetPosition = rallyPosition;
                newPatrolTarget = null;
                newPatrolTargetIndex = null;
            } else if (responseTarget) {
                targetPosition = responseTarget.position;
                newPatrolTarget = null;
                newPatrolTargetIndex = null;
            } else if (assignment) {
                if(assignment.type === 'patrol') {
                    if (!newPatrolTarget || calculateDistance(lat, lng, newPatrolTarget.lat, newPatrolTarget.lng) < 0.2) {
                        const { target, radius } = assignment;
                        const randomAngle = Math.random() * 2 * Math.PI;
                        const randomRadius = radius * Math.sqrt(Math.random());
                        const earthRadiusKm = 6371;

                        const latRad = target.lat * Math.PI / 180;
                        const lonRad = target.lng * Math.PI / 180;
                        
                        const newLatRad = Math.asin(Math.sin(latRad) * Math.cos(randomRadius / earthRadiusKm) + Math.cos(latRad) * Math.sin(randomRadius / earthRadiusKm) * Math.cos(randomAngle));
                        const newLonRad = lonRad + Math.atan2(Math.sin(randomAngle) * Math.sin(randomRadius / earthRadiusKm) * Math.cos(latRad), Math.cos(randomRadius / earthRadiusKm) - Math.sin(latRad) * Math.sin(newLatRad));

                        newPatrolTarget = { lat: newLatRad * 180 / Math.PI, lng: newLonRad * 180 / Math.PI };
                    }
                    targetPosition = newPatrolTarget;
                } else if (assignment.type === 'pendulum') {
                    if (newPatrolTargetIndex === null || newPatrolTargetIndex >= assignment.points.length) {
                        newPatrolTargetIndex = 0;
                    }
                    targetPosition = assignment.points[newPatrolTargetIndex];

                    if (calculateDistance(lat, lng, targetPosition.lat, targetPosition.lng) < 0.1) {
                        newPatrolTargetIndex = (newPatrolTargetIndex + 1) % assignment.points.length;
                        targetPosition = assignment.points[newPatrolTargetIndex];
                    }
                }
            } else if (groupCenter) {
                const distanceToGroupCenter = calculateDistance(lat, lng, groupCenter.lat, groupCenter.lng);
                if (distanceToGroupCenter > 1.0) { // If unit is straying too far (> 1km), move back
                    targetPosition = groupCenter;
                }
            }

            // --- Task-based movement and acceleration ---
            if (targetPosition) {
                const distanceToTarget = calculateDistance(lat, lng, targetPosition.lat, targetPosition.lng);
                const stopDistance = (targetPosition === rallyPosition) ? 0.5 : 0.1;

                if (distanceToTarget > stopDistance) {
                    newHeading = calculateBearing(lat, lng, targetPosition.lat, targetPosition.lng);
                    switch(unit.type) {
                        case 'Vehicle': case 'Military': case 'Police': targetSpeed = 80; break;
                        case 'Air': targetSpeed = 300; break;
                        case 'Personnel': case 'Support': targetSpeed = 5; break;
                    }
                } else {
                    targetSpeed = 0;
                    if (targetPosition === rallyPosition && newSpeed > 1) { // circling rally point
                        const headingUpdate = unit.heading + (Math.random() - 0.5) * 45;
                        newHeading = (headingUpdate % 360 + 360) % 360;
                        targetSpeed = 5;
                    }
                }
            } else {
                // Default random movement (if no other task)
                if (unit.status === 'Idle' && Math.random() > 0.1) { // 90% chance to stay idle
                    targetSpeed = 0;
                } else { // 10% chance to start moving, or continue moving
                    targetSpeed = (unit.type === 'Personnel' || unit.type === 'Support') ? 4 : 50;
                    if (newSpeed < 1) { // If just starting to move, pick a new direction
                        const headingUpdate = unit.heading + (Math.random() - 0.5) * 60;
                        newHeading = (headingUpdate % 360 + 360) % 360;
                    } else { // If already moving, slightly adjust course
                        const headingUpdate = unit.heading + (Math.random() - 0.5) * 15;
                        newHeading = (headingUpdate % 360 + 360) % 360;
                    }
                }
            }

            // Apply realistic, time-based acceleration/deceleration
            const accelerationKmhS = (unit.type === 'Air' ? 40 : (unit.type === 'Personnel' || unit.type === 'Support' ? 2 : 15));
            const decelerationKmhS = accelerationKmhS * 2; // Decelerate faster

            if (newSpeed < targetSpeed) {
                newSpeed += accelerationKmhS * timeSinceLastUpdate;
                newSpeed = Math.min(newSpeed, targetSpeed);
            } else if (newSpeed > targetSpeed) {
                newSpeed -= decelerationKmhS * timeSinceLastUpdate;
                newSpeed = Math.max(newSpeed, targetSpeed);
            }

            // --- End of Movement Logic ---

            if (newSpeed > 0.1) {
                const distance = (newSpeed / 3600) * timeSinceLastUpdate;
                const angleRad = (newHeading * Math.PI) / 180;
                const cosLat = Math.cos(lat * Math.PI / 180);
                
                if (Math.abs(cosLat) > 1e-9) {
                    lat += (distance * Math.cos(angleRad)) / 111.32;
                    lng += (distance * Math.sin(angleRad)) / (111.32 * cosLat);
                }

                lat = Math.max(-90, Math.min(90, lat));
                lng = (lng + 540) % 360 - 180;
            }

            let newStatus = unit.status;
            if (newBattery === 0 && !unit.isExternallyPowered) newStatus = 'Offline';
            else if (newStatus !== 'Alarm' && newStatus !== 'Maintenance') newStatus = newSpeed > 1 ? 'Moving' : 'Idle';
            
            let newLastMessage = unit.lastMessage;
            if (Math.random() < 0.005 && newStatus !== 'Offline') {
                const randomMessages = ["Alles in Ordnung.", "Benötige Status-Update.", "Position bestätigt.", "Verstanden."];
                const messageText = randomMessages[Math.floor(Math.random() * randomMessages.length)];
                newLastMessage = { text: messageText, timestamp: now, source: 'unit' };
                state = { ...state, messages: [...state.messages, { unitName: unit.name, text: messageText }] };
            }
            
            return { ...unit, position: { lat, lng }, speed: parseFloat(newSpeed.toFixed(1)), heading: parseInt(newHeading.toFixed(0)), battery: parseFloat(newBattery.toFixed(2)), status: newStatus, isActive: newBattery > 0 || unit.isExternallyPowered, timestamp: now, lastMessage: newLastMessage, patrolTarget: newPatrolTarget, patrolTargetIndex: newPatrolTargetIndex };
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
                    let minDistance = MAX_RANGE_KM;

                    // Find the closest already-connected unit to be its parent
                    updatedUnits.forEach(potentialParent => {
                        // A valid parent must be active and already part of the mesh
                        if (potentialParent.isActive && potentialParent.hopCount !== Infinity && potentialParent.id !== childUnit.id) {
                            const distance = calculateDistance(
                                childUnit.position.lat, childUnit.position.lng,
                                potentialParent.position.lat, potentialParent.position.lng
                            );

                            if (distance < minDistance) {
                                minDistance = distance;
                                bestParent = potentialParent;
                            }
                        }
                    });

                    // If a suitable parent was found, connect the child
                    if (bestParent) {
                        childUnit.hopCount = bestParent.hopCount + 1;
                        childUnit.signalStrength = Math.round(Math.max(-120, -50 - (minDistance * 20)));
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
    }, 1000);

    state = { ...state, simulationInterval: intervalId };
}

export function stopSimulation() {
    if (state.simulationInterval) {
        clearInterval(state.simulationInterval);
        state = { ...state, simulationInterval: null };
    }
}

export function getSnapshot() {
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

export function getConfig() {
    return {
        units: state.units,
        groups: state.groups,
        typeMapping: state.typeMapping,
        statusMapping: state.statusMapping
    }
}

export function updateConfig({ typeMapping, statusMapping }: { typeMapping: TypeMapping, statusMapping: StatusMapping }) {
    state = { ...state, typeMapping, statusMapping };
}

export function updateUnit(updatedUnit: MeshUnit) {
    state = {
        ...state,
        units: state.units.map(u => u.id === updatedUnit.id ? updatedUnit : u),
    };
}

export function addUnit() {
    const newId = state.units.length > 0 ? Math.max(...state.units.map(u => u.id)) + 1 : 1;
    const availableTypes = Object.values(state.typeMapping) as UnitType[];
    const type = availableTypes.length > 0 ? availableTypes[Math.floor(Math.random() * availableTypes.length)] : 'Support';
    
    const name = `${type}-${newId}`;
    const newUnit: MeshUnit = { id: newId, name, type, status: 'Online', position: { lat: baseCoords.lat + (Math.random() - 0.5) * 0.02, lng: baseCoords.lng + (Math.random() - 0.5) * 0.02 }, speed: 0, heading: Math.floor(Math.random() * 360), battery: 100, timestamp: Date.now(), sendInterval: 10, isActive: true, isExternallyPowered: false, lastMessage: null, groupId: null, signalStrength: -75, hopCount: 1, patrolTarget: null, patrolTargetIndex: null };
    state = { ...state, units: [...state.units, newUnit] };
}

export function removeUnit(unitId: number) {
    state = {
        ...state,
        units: state.units.filter(u => u.id !== unitId),
    };
}

export function chargeUnit(unitId: number) {
    state = {
        ...state,
        units: state.units.map(u => u.id === unitId ? { ...u, battery: 100, status: u.status === 'Offline' ? 'Online' : u.status, isActive: true } : u),
    };
}

export function sendMessage(message: string, target: 'all' | number) {
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

export function repositionAllUnits(radiusKm: number) {
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

export function addGroup(name: string) {
    const newGroup = { id: Date.now(), name };
    state = { ...state, groups: [...state.groups, newGroup] };
}

export function updateGroup(updatedGroup: Group) {
    state = {
        ...state,
        groups: state.groups.map(g => g.id === updatedGroup.id ? updatedGroup : g),
    };
}

export function removeGroup(groupId: number) {
    state = {
        ...state,
        groups: state.groups.filter(g => g.id !== groupId),
        units: state.units.map(u => u.groupId === groupId ? { ...u, groupId: null, patrolTarget: null, patrolTargetIndex: null } : u),
        assignments: state.assignments.filter(p => p.groupId !== groupId),
    };
}

export function assignUnitToGroup(unitId: number, groupId: number | null) {
    state = {
        ...state,
        units: state.units.map(u => u.id === unitId ? { ...u, groupId } : u),
    };
}

export function assignPatrolToGroup(groupId: number, target: { lat: number, lng: number }, radius: number) {
    const newAssignment: Assignment = { type: 'patrol', groupId, target, radius };
    const otherAssignments = state.assignments.filter(p => p.groupId !== groupId);
    state = {
        ...state,
        assignments: [...otherAssignments, newAssignment],
    };
}


export function assignPendulumToGroup(groupId: number, points: { lat: number, lng: number }[]) {
    const newAssignment: Assignment = { type: 'pendulum', groupId, points };
    const otherAssignments = state.assignments.filter(p => p.groupId !== groupId);
    state = {
        ...state,
        assignments: [...otherAssignments, newAssignment],
        units: state.units.map(u => u.groupId === groupId ? { ...u, patrolTarget: null, patrolTargetIndex: 0 } : u),
    };
}

export function removeAssignmentFromGroup(groupId: number) {
     state = {
        ...state,
        assignments: state.assignments.filter(p => p.groupId !== groupId),
        units: state.units.map(u => u.groupId === groupId ? { ...u, patrolTarget: null, patrolTargetIndex: null } : u),
    };
}

export function isSimulationRunning(): boolean {
    return state.simulationInterval !== null;
}

export function addTypeMapping(id: number, name: string) {
    if (state.typeMapping[id]) {
        throw new Error(`Die Typ-ID ${id} existiert bereits.`);
    }
    state = { ...state, typeMapping: { ...state.typeMapping, [id]: name } };
}

export function removeTypeMapping(id: number) {
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

export function addStatusMapping(id: number, name: string) {
    if (state.statusMapping[id]) {
        throw new Error(`Die Status-ID ${id} existiert bereits.`);
    }
    state = { ...state, statusMapping: { ...state.statusMapping, [id]: name } };
}

export function removeStatusMapping(id: number) {
    const statusName = state.statusMapping[id];
    if (!statusName) return;
    
    const unitsUsingStatus = state.units.filter(u => u.status === statusName);

    if (unitsUsingStatus.length > 0) {
        throw new Error(`Der Status "${statusName}" wird noch von ${unitsUsingStatus.length} Einheit(en) verwendet und kann nicht gelöscht werden.`);
    }
    
    const newMapping = { ...state.typeMapping };
    delete newMapping[id];
    state = { ...state, statusMapping: newMapping };
}
