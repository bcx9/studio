
export type UnitType = 'Vehicle' | 'Personnel';
export type UnitStatus = 'Online' | 'Moving' | 'Idle' | 'Alarm' | 'Offline';

export interface UnitMessage {
    text: string;
    timestamp: number;
    source: 'unit' | 'control';
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
}

export interface Group {
    id: number;
    name: string;
}

export interface UnitHistoryPoint {
    position: { lat: number; lng: number };
    status: UnitStatus;
    timestamp: number;
    battery: number;
    lastMessage: UnitMessage | null;
}

// Compact data representation for network efficiency
export const CODE_TO_UNIT_TYPE: Record<number, UnitType> = {
  1: 'Vehicle',
  2: 'Personnel',
};

export const UNIT_TYPE_TO_CODE: Record<UnitType, number> = {
  Vehicle: 1,
  Personnel: 2,
};

export const CODE_TO_UNIT_STATUS: Record<number, UnitStatus> = {
  1: 'Online',
  2: 'Moving',
  3: 'Idle',
  4: 'Alarm',
  5: 'Offline',
};

export const UNIT_STATUS_TO_CODE: Record<UnitStatus, number> = {
  Online: 1,
  Moving: 2,
  Idle: 3,
  Alarm: 4,
  Offline: 5,
};
