
export type UnitType = string;
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
}

export interface Group {
    id: number;
    name: string;
}

export type TypeMapping = Record<number, string>;
export type StatusMapping = Record<number, string>;

export interface NetworkSnapshot {
    units: MeshUnit[];
    groups: Group[];
    messages: ToastMessage[];
    typeMapping: TypeMapping;
    statusMapping: StatusMapping;
}

// Default configurations, can be overridden by the user in the admin panel
export const DEFAULT_CODE_TO_UNIT_TYPE: TypeMapping = {
  1: 'HLF-20',
  2: 'AT',
  3: 'ELW-1',
  4: 'Wassertrupp',
  5: 'DLK-23',
  6: 'RTW',
  7: 'NEF',
  8: 'MTF',
  9: 'Gerätewagen',
  10: 'Einsatzleiter',
  98: 'Vehicle',
  99: 'Personnel',
};


export const DEFAULT_CODE_TO_UNIT_STATUS: StatusMapping = {
  1: 'Online',
  2: 'Moving',
  3: 'Idle',
  4: 'Alarm',
  5: 'Offline',
  6: 'Maintenance',
};
