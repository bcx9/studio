
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { MeshUnit, Group, TypeMapping, StatusMapping, UnitMessage, Assignment } from '@/types/mesh';
import {
  getNetworkSnapshot,
  updateUnitOnBackend,
  addUnitOnBackend,
  removeUnitOnBackend,
  chargeUnitOnBackend,
  sendMessageOnBackend,
  repositionAllUnitsOnBackend,
  addGroupOnBackend,
  updateGroupOnBackend,
  removeGroupOnBackend,
  assignUnitToGroupOnBackend,
  assignPatrolToGroupOnBackend,
  removeAssignmentFromGroupOnBackend,
  assignPendulumToGroupOnBackend,
  setUnitStatusOnBackend,
} from '@/app/actions';

interface ToastMessage {
    unitName: string;
    text: string;
}

interface UseMeshDataProps {
  onUnitMessage: (unitName: string, message: string) => void;
}

export function useMeshData({ onUnitMessage }: UseMeshDataProps) {
  const [units, setUnits] = useState<MeshUnit[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [typeMapping, setTypeMapping] = useState<TypeMapping>({});
  const [statusMapping, setStatusMapping] = useState<StatusMapping>({});

  useEffect(() => {
    const fetchInitialData = async () => {
        try {
            const snapshot = await getNetworkSnapshot();
            setUnits(snapshot.units);
            setGroups(snapshot.groups);
            setTypeMapping(snapshot.typeMapping);
            setStatusMapping(snapshot.statusMapping);
            setAssignments(snapshot.assignments);
            setIsInitialized(true);
        } catch (error) {
            console.error("Failed to fetch initial network snapshot", error);
        }
    }

    fetchInitialData();

    const intervalId = setInterval(async () => {
        try {
            const snapshot = await getNetworkSnapshot();
            setUnits(snapshot.units);
            setGroups(snapshot.groups);
            setTypeMapping(snapshot.typeMapping);
            setStatusMapping(snapshot.statusMapping);
            setAssignments(snapshot.assignments);

            snapshot.messages.forEach(msg => onUnitMessage(msg.unitName, msg.text));

        } catch (error) {
            console.error("Failed to fetch network snapshot", error);
        }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [onUnitMessage]);

  const updateUnit = useCallback(async (updatedUnit: MeshUnit) => {
    await updateUnitOnBackend(updatedUnit);
  }, []);

  const setUnitStatus = useCallback(async (unitId: number, status: string) => {
    await setUnitStatusOnBackend(unitId, status);
  }, []);

  const addUnit = useCallback(async () => {
    await addUnitOnBackend();
  }, []);

  const removeUnit = useCallback(async (unitId: number) => {
    await removeUnitOnBackend(unitId);
  }, []);

  const chargeUnit = useCallback(async (unitId: number) => {
    await chargeUnitOnBackend(unitId);
  }, []);

  const sendMessage = useCallback(async (message: string, target: 'all' | number) => {
    await sendMessageOnBackend(message, target);
  }, []);

  const repositionAllUnits = useCallback(async (radiusKm: number) => {
    await repositionAllUnitsOnBackend(radiusKm);
  }, []);

  const addGroup = useCallback(async (name: string) => {
    await addGroupOnBackend(name);
  }, []);

  const updateGroup = useCallback(async (updatedGroup: Group) => {
    await updateGroupOnBackend(updatedGroup);
  }, []);

  const removeGroup = useCallback(async (groupId: number) => {
    await removeGroupOnBackend(groupId);
  }, []);

  const assignUnitToGroup = useCallback(async (unitId: number, groupId: number | null) => {
    await assignUnitToGroupOnBackend(unitId, groupId);
  }, []);

  const assignPatrolToGroup = useCallback(async (groupId: number, target: { lat: number, lng: number }, radius: number) => {
    await assignPatrolToGroupOnBackend(groupId, target, radius);
  }, []);
  
  const assignPendulumToGroup = useCallback(async (groupId: number, points: { lat: number, lng: number }[]) => {
    await assignPendulumToGroupOnBackend(groupId, points);
  }, []);

  const removeAssignmentFromGroup = useCallback(async (groupId: number) => {
    await removeAssignmentFromGroupOnBackend(groupId);
  }, []);

  return {
    units,
    updateUnit,
    setUnitStatus,
    addUnit,
    removeUnit,
    chargeUnit,
    isInitialized,
    sendMessage,
    groups,
    addGroup,
    updateGroup,
    removeGroup,
    assignUnitToGroup,
    repositionAllUnits,
    typeMapping,
    statusMapping,
    assignments,
    assignPatrolToGroup,
    assignPendulumToGroup,
    removeAssignmentFromGroup,
  };
}
