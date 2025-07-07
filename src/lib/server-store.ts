
import type { MeshUnit, Group, TypeMapping, StatusMapping, UnitType, ToastMessage } from '@/types/mesh';
import { DEFAULT_CODE_TO_UNIT_TYPE, DEFAULT_CODE_TO_UNIT_STATUS } from '@/types/mesh';
import { calculateBearing, calculateDistance, createReverseMapping } from '@/lib/utils';

const baseCoords = { lat: 53.19745, lng: 10.84507 };

const initialUnits: MeshUnit[] = [
  { id: 1, name: 'HLF-20', type: 'Vehicle', status: 'Online', position: { lat: baseCoords.lat + (Math.random() - 0.5) * 0.02, lng: baseCoords.lng + (Math.random() - 0.5) * 0.02 }, speed: 0, heading: 45, battery: 95, timestamp: Date.now(), sendInterval: 5, isActive: true, isExternallyPowered: false, lastMessage: null, groupId: 1, signalStrength: -65, hopCount: 1 },
  { id: 2, name: 'AT-1', type: 'Personnel', status: 'Online', position: { lat: baseCoords.lat + (Math.random() - 0.5) * 0.02, lng: baseCoords.lng + (Math.random() - 0.5) * 0.02 }, speed: 3, heading: 180, battery: 88, timestamp: Date.now(), sendInterval: 10, isActive: true, isExternallyPowered: false, lastMessage: null, groupId: 2, signalStrength: -82, hopCount: 2 },
  { id: 3, name: 'ELW-1', type: 'Vehicle', status: 'Alarm', position: { lat: baseCoords.lat + (Math.random() - 0.5) * 0.02, lng: baseCoords.lng + (Math.random() - 0.5) * 0.02 }, speed: 0, heading: 270, battery: 15, timestamp: Date.now(), sendInterval: 5, isActive: true, isExternallyPowered: false, lastMessage: null, groupId: 1, signalStrength: -71, hopCount: 1 },
  { id: 4, name: 'AT-2', type: 'Personnel', status: 'Offline', position: { lat: baseCoords.lat + (Math.random() - 0.5) * 0.02, lng: baseCoords.lng + (Math.random() - 0.5) * 0.02 }, speed: 0, heading: 0, battery: 0, timestamp: Date.now() - 600000, sendInterval: 30, isActive: false, isExternallyPowered: false, lastMessage: null, groupId: 2, signalStrength: -120, hopCount: 0 },
];

const initialGroups: Group[] = [
    { id: 1, name: "Fahrzeug-Gruppe" },
    { id: 2, name: "Angriffstrupp" }
];

const nameTemplates: Record<string, string[]> = {
    Vehicle: ['RTW', 'NEF', 'GW-L', 'DLK-23', 'TSF-W'],
    Personnel: ['GF', 'ZF', 'MA', 'SAN', 'PA-1', 'PA-2'],
};

interface ServerState {
    units: MeshUnit[];
    groups: Group[];
    typeMapping: TypeMapping;
    statusMapping: StatusMapping;
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
        
        const newUnits = state.units.map(unit => {
            if (!unit.isActive) {
                if (unit.status !== 'Offline') {
                    return { ...unit, status: 'Offline', signalStrength: -120, hopCount: 0 };
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
                newBattery = Math.min(100, unit.battery + 0.5 * (timeSinceLastUpdate / 5));
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
                    newSpeed = unit.type === 'Vehicle' ? Math.max(10, Math.min(60, unit.speed + (Math.random() - 0.4) * 4)) : Math.max(2, Math.min(7, unit.speed + (Math.random() - 0.5) * 2));
                } else {
                    newSpeed = unit.type === 'Vehicle' ? Math.max(0, Math.min(15, unit.speed + (Math.random() - 0.5) * 4)) : Math.max(0, Math.min(5, unit.speed + (Math.random() - 0.5) * 2));
                    if (newSpeed > (unit.type === 'Vehicle' ? 1 : 0.5)) {
                        const headingUpdate = unit.heading + (Math.random() - 0.5) * (unit.type === 'Vehicle' ? 25 : 60);
                        newHeading = (headingUpdate % 360 + 360) % 360;
                    }
                }
            } else {
                newSpeed = unit.type === 'Vehicle' ? Math.max(0, Math.min(60, unit.speed + (Math.random() - 0.4) * 4)) : Math.max(0, Math.min(7, unit.speed + (Math.random() - 0.5) * 2));
                if (newSpeed > (unit.type === 'Vehicle' ? 1 : 0.5)) {
                    const headingUpdate = unit.heading + (Math.random() - 0.5) * (unit.type === 'Vehicle' ? 10 : 45);
                    newHeading = (headingUpdate % 360 + 360) % 360;
                }
            }

            if (newSpeed > 1) {
                const distance = (newSpeed / 3600) * timeSinceLastUpdate;
                const angleRad = (newHeading * Math.PI) / 180;
                const cosLat = Math.cos(lat * Math.PI / 180);

                if (Math.abs(cosLat) > 1e-9) { // Prevent division by zero at the poles
                    lat += (distance * Math.cos(angleRad)) / 111.32;
                    lng += (distance * Math.sin(angleRad)) / (111.32 * cosLat);
                }

                // Clamp latitude and wrap longitude to keep them in valid ranges
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
                state.messages.push({ unitName: unit.name, text: messageText });
            }
            
            return { ...unit, position: { lat, lng }, speed: parseFloat(newSpeed.toFixed(1)), heading: parseInt(newHeading.toFixed(0)), battery: parseFloat(newBattery.toFixed(2)), status: newStatus, isActive: newBattery > 0 || unit.isExternallyPowered, timestamp: now, lastMessage: newLastMessage, signalStrength: Math.floor(Math.max(-120, Math.min(-50, unit.signalStrength + (Math.random() - 0.5) * 5))), hopCount: Math.max(1, Math.min(4, unit.hopCount + (Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0))) };
        });
        
        state = { ...state, units: newUnits };
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
        statusMapping: state.statusMapping
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
    const availableTypes = Object.values(state.typeMapping);
    const type: UnitType = availableTypes.length > 0 ? availableTypes[Math.floor(Math.random() * availableTypes.length)] : 'Generic';
    const namePrefix = nameTemplates[type as keyof typeof nameTemplates]?.[Math.floor(Math.random() * nameTemplates[type as keyof typeof nameTemplates]?.length)] || type;
    const name = `${namePrefix}-${newId}`;
    const newUnit: MeshUnit = { id: newId, name, type, status: 'Online', position: { lat: baseCoords.lat + (Math.random() - 0.5) * 0.02, lng: baseCoords.lng + (Math.random() - 0.5) * 0.02 }, speed: 0, heading: Math.floor(Math.random() * 360), battery: 100, timestamp: Date.now(), sendInterval: 10, isActive: true, isExternallyPowered: false, lastMessage: null, groupId: null, signalStrength: -75, hopCount: 1 };
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
        const newLonRad = lon1Rad + Math.atan2(Math.sin(randomAngle) * Math.sin(angularDistance) * Math.cos(lat1Rad), Math.cos(angularDistance) - Math.sin(lat1Rad) * Math.sin(newLatRad));
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
        units: state.units.map(u => u.groupId === groupId ? { ...u, groupId: null } : u),
    };
}

export function assignUnitToGroup(unitId: number, groupId: number | null) {
    state = {
        ...state,
        units: state.units.map(u => u.id === unitId ? { ...u, groupId } : u),
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
    
    const newMapping = { ...state.statusMapping };
    delete newMapping[id];
    state = { ...state, statusMapping: newMapping };
}
