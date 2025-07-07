'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plug, Wifi, Usb, Server, Terminal } from 'lucide-react';
import type { GatewayStatus, ConnectionType, ConnectionSettings } from '@/types/gateway';

interface GatewayConfigProps {
  status: GatewayStatus;
  logs: string[];
  onConnect: (settings: ConnectionSettings) => void;
  onDisconnect: () => void;
  isConnecting: boolean;
}

export default function GatewayConfig({ status, logs, onConnect, onDisconnect, isConnecting }: GatewayConfigProps) {
    const [connectionType, setConnectionType] = React.useState<ConnectionType>('serial');
    const [settings, setSettings] = React.useState<ConnectionSettings>({
        type: 'serial',
        serialPort: '/dev/ttyUSB0',
        baudRate: 115200,
        ipAddress: '192.168.1.100',
        port: 8080,
    });

    const handleConnect = () => {
        onConnect(settings);
    }
    
    const handleSettingChange = (field: keyof ConnectionSettings, value: any) => {
        setSettings(prev => ({ ...prev, [field]: value, type: connectionType }));
    }

    const handleTypeChange = (type: ConnectionType) => {
        setConnectionType(type);
        setSettings(prev => ({...prev, type: type}));
    }

    const isConnected = status === 'connected';

    return (
        <div className="container mx-auto max-w-4xl py-8">
            <Card>
                <CardHeader>
                    <div className='flex items-center gap-3'>
                        <Server className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle className="text-2xl">Gateway-Konfiguration</CardTitle>
                            <CardDescription>
                                Konfigurieren Sie hier die Verbindung zu Ihrer Meshtastic-Gateway-Node, um Live-Daten zu empfangen.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-8">
                    <div className='space-y-6'>
                        <h3 className="font-semibold text-lg">Verbindungseinstellungen</h3>
                        <RadioGroup value={connectionType} onValueChange={handleTypeChange} className="flex gap-4" disabled={isConnected || isConnecting}>
                            <Label htmlFor="serial" className="flex items-center gap-2 border rounded-md p-3 flex-1 has-[[data-state=checked]]:border-primary cursor-pointer">
                                <RadioGroupItem value="serial" id="serial" />
                                <Usb className="h-5 w-5 mr-1" /> Serieller Port (USB)
                            </Label>
                            <Label htmlFor="network" className="flex items-center gap-2 border rounded-md p-3 flex-1 has-[[data-state=checked]]:border-primary cursor-pointer">
                                <RadioGroupItem value="network" id="network"/>
                                <Wifi className="h-5 w-5 mr-1" /> Netzwerk (TCP/IP)
                            </Label>
                        </RadioGroup>

                        {connectionType === 'serial' && (
                            <div className="space-y-4 animate-in fade-in-50">
                                <div className="space-y-2">
                                    <Label htmlFor="serial-port">Serieller Port</Label>
                                    <Input id="serial-port" value={settings.serialPort} onChange={e => handleSettingChange('serialPort', e.target.value)} disabled={isConnected || isConnecting} placeholder="/dev/ttyUSB0 or COM3" />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="baud-rate">Baudrate</Label>
                                     <Select value={String(settings.baudRate)} onValueChange={val => handleSettingChange('baudRate', Number(val))} disabled={isConnected || isConnecting}>
                                        <SelectTrigger id="baud-rate">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="9600">9600</SelectItem>
                                            <SelectItem value="19200">19200</SelectItem>
                                            <SelectItem value="38400">38400</SelectItem>
                                            <SelectItem value="57600">57600</SelectItem>
                                            <SelectItem value="115200">115200</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        {connectionType === 'network' && (
                             <div className="space-y-4 animate-in fade-in-50">
                                <div className="space-y-2">
                                    <Label htmlFor="ip-address">IP-Adresse</Label>
                                    <Input id="ip-address" value={settings.ipAddress} onChange={e => handleSettingChange('ipAddress', e.target.value)} disabled={isConnected || isConnecting} placeholder="192.168.1.100" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="port">Port</Label>
                                    <Input id="port" type="number" value={settings.port} onChange={e => handleSettingChange('port', Number(e.target.value))} disabled={isConnected || isConnecting} placeholder="8080" />
                                </div>
                            </div>
                        )}
                        
                        <div>
                            {isConnected ? (
                                <Button variant="destructive" className="w-full" onClick={onDisconnect} disabled={isConnecting}>
                                    <Plug className="mr-2 h-4 w-4" /> Verbindung trennen
                                </Button>
                            ) : (
                                <Button className="w-full" onClick={handleConnect} disabled={isConnecting}>
                                    {isConnecting ? 'Verbinde...' : 'Verbinden'}
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className='space-y-6'>
                        <h3 className="font-semibold text-lg">Status & Logs</h3>
                        <Card>
                            <CardContent className="p-4">
                                <p>Status: <span className="font-semibold capitalize">{status}</span></p>
                            </CardContent>
                        </Card>
                        <div className="space-y-2">
                            <Label htmlFor="logs">Live-Logs</Label>
                            <div id="logs" className="h-48 bg-muted text-foreground font-mono text-xs rounded-md p-3 overflow-y-auto">
                                <Terminal className="h-4 w-4 inline-block mr-2" /> Gateway Logs:
                                <pre className="whitespace-pre-wrap">
                                    {logs.join('\n')}
                                </pre>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
