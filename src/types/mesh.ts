export type UnitStatus = 'Online' | 'Offline' | 'Alarm' | 'Moving' | 'Idle';
export type UnitType = 'Vehicle' | 'Personnel';

export interface MeshUnit {
  id: number;
  name: string;
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
}
