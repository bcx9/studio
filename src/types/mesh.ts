
export type UnitStatus = 'Online' | 'Offline' | 'Alarm' | 'Moving' | 'Idle';
export type UnitType = 'Vehicle' | 'Personnel';

// Mappings for compact data transmission
export const UNIT_TYPE_TO_CODE: { [key in UnitType]: number } = {
  Vehicle: 0,
  Personnel: 1,
};

export const CODE_TO_UNIT_TYPE: { [key: number]: UnitType } = {
  0: 'Vehicle',
  1: 'Personnel',
};

export const UNIT_STATUS_TO_CODE: { [key in UnitStatus]: number } = {
  Online: 0,
  Moving: 1,
  Idle: 2,
  Alarm: 3,
  Offline: 4,
};

export const CODE_TO_UNIT_STATUS: { [key: number]: UnitStatus } = {
  0: 'Online',
  1: 'Moving',
  2: 'Idle',
  3: 'Alarm',
  4: 'Offline',
};

export interface UnitMessage {
  text: string;
  timestamp: number;
}

export interface Group {
  id: number;
  name: string;
}

export interface MeshUnit {
  id: number;
  name:string;
  type: UnitType;
  status: UnitStatus;
  position: {
    lat: number;
    lng: number;
  };
  speed: number; // km/h
  heading: number; // degrees
  battery: number; // percentage
  timestamp: number; // Unix timestamp
  sendInterval: number; // seconds
  isActive: boolean;
  lastMessage: UnitMessage | null;
  groupId?: number | null;
}

export interface UnitHistoryPoint {
  position: { lat: number; lng: number };
  status: UnitStatus;
  timestamp: number;
  battery: number;
  lastMessage: UnitMessage | null;
}
