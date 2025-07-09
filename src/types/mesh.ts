
export type UnitType = 'Vehicle' | 'Personnel' | 'Support' | 'Air' | 'Military' | 'Police';
export type UnitStatus = string;

export interface UnitMessage {
    text: string;
    timestamp: number;
    source: 'unit' | 'control';
}

export interface ToastMessage {
    unitName: string;
    text: string;
}

export interface MeshUnit {
  id: number;
  name: string;
  type: UnitType;
  status: UnitStatus;
  position: { lat: number; lng: number };
  speed: number;
  heading: number;
  battery: number;
  timestamp: number;
  sendInterval: number; // in seconds
  isActive: boolean;
  isExternallyPowered: boolean;
  lastMessage: UnitMessage | null;
  groupId: number | null;
  signalStrength: number; // RSSI in dBm
  hopCount: number;
  patrolTarget: { lat: number; lng: number } | null;
  patrolTargetIndex: number | null;
}

export interface Group {
    id: number;
    name: string;
}

export interface PatrolAssignment {
    groupId: number;
    type: 'patrol';
    target: { lat: number; lng: number };
    radius: number; // in km
}

export interface PendulumAssignment {
    groupId: number;
    type: 'pendulum';
    points: { lat: number; lng: number }[];
}

export type Assignment = PatrolAssignment | PendulumAssignment;


export type TypeMapping = Record<number, string>;
export type StatusMapping = Record<number, string>;

export interface NetworkSnapshot {
    units: MeshUnit[];
    groups: Group[];
    messages: ToastMessage[];
    typeMapping: TypeMapping;
    statusMapping: StatusMapping;
    assignments: Assignment[];
    maxRangeKm: number;
}

// Default configurations, can be overridden by the user in the admin panel
export const DEFAULT_CODE_TO_UNIT_TYPE: TypeMapping = {
  1: 'Vehicle',
  2: 'Personnel',
  3: 'Support',
  4: 'Air',
  5: 'Military',
  6: 'Police',
};


export const DEFAULT_CODE_TO_UNIT_STATUS: StatusMapping = {
  1: 'Online',
  2: 'Moving',
  3: 'Idle',
  4: 'Alarm',
  5: 'Offline',
  6: 'Maintenance',
};
