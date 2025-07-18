
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
  chargeAllUnits as chargeAllUnitsInStore,
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
  setControlCenterPosition as setControlCenterPositionInStore,
  setRallying as setRallyingInStore,
  setUnitStatus as setUnitStatusInStore,
} from '@/lib/server-store';


export async function getNetworkSnapshot() {
  return await getSnapshot();
}

export async function getGatewayStatus() {
    return { isConnected: await isSimulationRunning() };
}

export async function connectToGateway(settings: ConnectionSettings): Promise<{ success: boolean; message: string }> {
  console.log('Verbindungsversuch mit Modus:', settings.mode, 'und Einstellungen:', settings);
  
  if (settings.mode === 'simulation') {
    await startSimulation();
    return { success: true, message: 'Simulation erfolgreich gestartet. Sende simulierte Daten...' };
  }

  if (settings.mode === 'real') {
    if (settings.connectionType === 'serial' && settings.serialPort?.toLowerCase().includes('error')) {
        return { success: false, message: `Fehler: Serieller Port ${settings.serialPort} konnte nicht geöffnet werden.` };
    }
    if (settings.connectionType === 'network' && settings.ipAddress?.includes('0.0.0.0')) {
        return { success: false, message: `Fehler: Verbindung zu ${settings.ipAddress}:${settings.port} fehlgeschlagen.` };
    }
    
    // This is where the actual connection logic for a real device would go.
    // For now, we'll just return a success message indicating it's not fully implemented yet.
    return { success: false, message: 'Die Anbindung für echte Geräte ist vorbereitet, aber noch nicht implementiert.' };
  }

  return { success: false, message: 'Unbekannter Gateway-Modus.' };
}

export async function disconnectFromGateway(): Promise<{ success: boolean; message: string }> {
    // In the future, this would also close the real connection.
    await stopSimulation();
    return { success: true, message: 'Verbindung zum Gateway getrennt.' };
}


export async function loadAdminSettings() {
    const { typeMapping, statusMapping, maxRangeKm } = await getConfig();
    return { typeMapping, statusMapping, maxRangeKm };
}

export async function saveAdminSettings(config: {typeMapping: TypeMapping, statusMapping: StatusMapping, maxRangeKm: number}) {
    await updateConfig(config);
    return { success: true };
}

export async function updateUnitOnBackend(unit: MeshUnit) {
    await updateUnit(unit);
    return { success: true };
}

export async function setUnitStatusOnBackend(unitId: number, status: string) {
    await setUnitStatusInStore(unitId, status);
    return { success: true };
}


export async function addUnitOnBackend() {
    await addUnitInStore();
    return { success: true };
}

export async function removeUnitOnBackend(unitId: number) {
    await removeUnitInStore(unitId);
    return { success: true };
}

export async function chargeUnitOnBackend(unitId: number) {
    await chargeUnitInStore(unitId);
    return { success: true };
}

export async function chargeAllUnitsOnBackend() {
    await chargeAllUnitsInStore();
    return { success: true };
}

export async function sendMessageOnBackend(message: string, target: 'all' | number) {
    await sendMessageInStore(message, target);
    return { success: true };
}

export async function repositionAllUnitsOnBackend(radius: number) {
    await repositionAllUnitsInStore(radius);
    return { success: true };
}

export async function addGroupOnBackend(name: string) {
    await addGroupInStore(name);
    return { success: true };
}

export async function updateGroupOnBackend(group: Group) {
    await updateGroupInStore(group);
    return { success: true };
}

export async function removeGroupOnBackend(groupId: number) {
    await removeGroupInStore(groupId);
    return { success: true };
}

export async function assignUnitToGroupOnBackend(unitId: number, groupId: number | null) {
    await assignUnitToGroupInStore(unitId, groupId);
    return { success: true };
}

export async function assignPatrolToGroupOnBackend(groupId: number, target: { lat: number; lng: number }, radius: number) {
    await assignPatrolToGroupInStore(groupId, target, radius);
    return { success: true };
}

export async function assignPendulumToGroupOnBackend(groupId: number, points: { lat: number, lng: number }[]) {
    await assignPendulumToGroupInStore(groupId, points);
    return { success: true };
}

export async function removeAssignmentFromGroupOnBackend(groupId: number) {
    await removeAssignmentFromGroupInStore(groupId);
    return { success: true };
}

export async function addTypeMapping(id: number, name: string) {
    try {
        await addTypeMappingInStore(id, name);
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
export async function removeTypeMapping(id: number) {
    try {
        await removeTypeMappingInStore(id);
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function addStatusMapping(id: number, name: string) {
     try {
        await addStatusMappingInStore(id, name);
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
export async function removeStatusMapping(id: number) {
    try {
        await removeStatusMappingInStore(id);
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

export async function setRallyingOnBackend(isRallying: boolean) {
    await setRallyingInStore(isRallying);
    return { success: true };
}

export async function setControlCenterPositionOnBackend(position: { lat: number; lng: number } | null) {
    await setControlCenterPositionInStore(position);
    return { success: true };
}
