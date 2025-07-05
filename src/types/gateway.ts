
export type GatewayStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
export type ConnectionType = 'serial' | 'network';

export interface ConnectionSettings {
    type: ConnectionType;
    serialPort?: string;
    baudRate?: number;
    ipAddress?: string;
    port?: number;
}
