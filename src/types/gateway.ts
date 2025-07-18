
export type GatewayStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
export type ConnectionType = 'serial' | 'network';
export type GatewayMode = 'simulation' | 'real';

export interface ConnectionSettings {
    mode: GatewayMode;
    connectionType?: ConnectionType;
    serialPort?: string;
    baudRate?: number;
    ipAddress?: string;
    port?: number;
}
