
'use server';

import type { ConnectionSettings } from '@/types/gateway';
import type { Group, MeshUnit, StatusMapping, TypeMapping } from '@/types/mesh';
import {
  getSnapshot,
  startSimulation,
  stopSimulation,
  updateUnit,
  addUnit as addUnitInStore,
  removeUnit as removeUnitInStore,
  chargeUnit as chargeUnitInStore,
  sendMessage as sendMessageInStore,
  repositionAllUnits as repositionAllUnitsInStore,
  addGroup as addGroupInStore,
  updateGroup as updateGroupInStore,
  removeGroup as removeGroupInStore,
  assignUnitToGroup as assignUnitToGroupInStore,
  getConfig,
  updateConfig,
  isSimulationRunning,
  addTypeMapping as addTypeMappingInStore,
  removeTypeMapping as removeTypeMappingInStore,
  addStatusMapping as addStatusMappingInStore,
  removeStatusMapping as removeStatusMappingInStore,
  assignPatrolToGroup as assignPatrolToGroupInStore,
  assignPendulumToGroup as assignPendulumToGroupInStore,
  removeAssignmentFromGroup as removeAssignmentFromGroupInStore,
} from '@/lib/server-store';
import { analyzeNetwork } from '@/ai/flows/network-analysis-flow';
import { createReverseMapping } from '@/lib/utils';
import { AiAssistantInput, aiAssistantFlow } from '@/ai/flows/ai-assistant-flow';


export async function getNetworkSnapshot() {
  return getSnapshot();
}

export async function getGatewayStatus() {
    return { isConnected: isSimulationRunning() };
}

export async function connectToGateway(settings: ConnectionSettings): Promise<{ success: boolean; message: string }> {
  console.log('Verbindungsversuch mit Einstellungen:', settings);
  
  if (settings.type === 'serial' && settings.serialPort?.toLowerCase().includes('error')) {
      return { success: false, message: `Fehler: Serieller Port ${settings.serialPort} konnte nicht geöffnet werden. (Simuliert)` };
  }
  if (settings.type === 'network' && settings.ipAddress?.includes('0.0.0.0')) {
      return { success: false, message: `Fehler: Verbindung zu ${settings.ipAddress}:${settings.port} fehlgeschlagen. (Simuliert)` };
  }

  startSimulation();
  return { success: true, message: 'Verbindung zum Gateway erfolgreich hergestellt. Sende Daten... (Simuliert)' };
}

export async function disconnectFromGateway(): Promise<{ success: boolean; message: string }> {
    stopSimulation();
    return { success: true, message: 'Verbindung zum Gateway getrennt.' };
}

export async function getNetworkAnalysis(): Promise<{ summary: string; details: string }> {
  try {
    const { units, typeMapping, statusMapping } = getConfig();

    const UNIT_TYPE_TO_CODE = createReverseMapping(typeMapping);
    const UNIT_STATUS_TO_CODE = createReverseMapping(statusMapping);

    const compactUnits = units.map(unit => ({
        i: unit.id,
        t: Number(UNIT_TYPE_TO_CODE[unit.type]),
        s: Number(UNIT_STATUS_TO_CODE[unit.status]),
        p: {
            a: parseFloat(unit.position.lat.toFixed(5)),
            o: parseFloat(unit.position.lng.toFixed(5)),
        },
        v: unit.speed,
        h: unit.heading,
        b: parseFloat(unit.battery.toFixed(1)),
        ts: unit.timestamp,
        si: unit.sendInterval,
        a: unit.isActive ? 1 : 0,
        ss: unit.signalStrength,
        hc: unit.hopCount,
    }));
        
    const unitNames = units.reduce((acc, unit) => {
        acc[unit.id] = unit.name;
        return acc;
    }, {} as Record<number, string>);

    const analysis = await analyzeNetwork({ units: compactUnits, unitNames, typeMapping, statusMapping });
    return analysis;
  } catch (error) {
    console.error('Genkit flow failed:', error);
    return {
      summary: 'Analyse Fehlgeschlagen',
      details: 'Die KI-Analyse konnte nicht durchgeführt werden. Überprüfen Sie die Server-Logs.',
    };
  }
}

export async function loadAdminSettings() {
    const { typeMapping, statusMapping } = getConfig();
    return { typeMapping, statusMapping };
}

export async function saveAdminSettings(config: {typeMapping: TypeMapping, statusMapping: StatusMapping}) {
    updateConfig(config);
    return { success: true };
}

export async function updateUnitOnBackend(unit: MeshUnit) {
    updateUnit(unit);
    return { success: true };
}

export async function addUnitOnBackend() {
    addUnitInStore();
    return { success: true };
}

export async function removeUnitOnBackend(unitId: number) {
    removeUnitInStore(unitId);
    return { success: true };
}

export async function chargeUnitOnBackend(unitId: number) {
    chargeUnitInStore(unitId);
    return { success: true };
}

export async function sendMessageOnBackend(message: string, target: 'all' | number) {
    sendMessageInStore(message, target);
    return { success: true };
}

export async function repositionAllUnitsOnBackend(radius: number) {
    repositionAllUnitsInStore(radius);
    return { success: true };
}

export async function addGroupOnBackend(name: string) {
    addGroupInStore(name);
    return { success: true };
}

export async function updateGroupOnBackend(group: Group) {
    updateGroupInStore(group);
    return { success: true };
}

export async function removeGroupOnBackend(groupId: number) {
    removeGroupInStore(groupId);
    return { success: true };
}

export async function assignUnitToGroupOnBackend(unitId: number, groupId: number | null) {
    assignUnitToGroupInStore(unitId, groupId);
    return { success: true };
}

export async function assignPatrolToGroupOnBackend(groupId: number, target: { lat: number; lng: number }, radius: number) {
    assignPatrolToGroupInStore(groupId, target, radius);
    return { success: true };
}

export async function assignPendulumToGroupOnBackend(groupId: number, points: { lat: number, lng: number }[]) {
    assignPendulumToGroupInStore(groupId, points);
    return { success: true };
}

export async function removeAssignmentFromGroupOnBackend(groupId: number) {
    removeAssignmentFromGroupInStore(groupId);
    return { success: true };
}

export async function addTypeMapping(id: number, name: string) {
    try {
        addTypeMappingInStore(id, name);
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
export async function removeTypeMapping(id: number) {
    try {
        removeTypeMappingInStore(id);
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function addStatusMapping(id: number, name: string) {
     try {
        addStatusMappingInStore(id, name);
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
export async function removeStatusMapping(id: number) {
    try {
        removeStatusMappingInStore(id);
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}


export async function verifyAdminPassword(password: string): Promise<{ success: boolean }> {
  // Use a default password if the environment variable is not set.
  // In a real production environment, this should always be set in a .env.local file.
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
  
  return { success: password === adminPassword };
}


export async function invokeAiAssistant(
  query: string,
  units: AiAssistantInput['units'],
  groups: AiAssistantInput['groups'],
  unitNames: AiAssistantInput['unitNames']
) {
  return await aiAssistantFlow({ query, units, groups, unitNames });
}
