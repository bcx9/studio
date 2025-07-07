'use client';
import * as React from 'react';
import Link from 'next/link';
import AdminSettings from '@/components/admin-settings';
import GatewayConfig from '@/components/gateway-config';
import type { GatewayStatus, ConnectionSettings } from '@/types/gateway';
import { connectToGateway, disconnectFromGateway, getGatewayStatus } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BotMessageSquare } from 'lucide-react';
import ThemeToggle from '@/components/theme-toggle';
import AdminAuth from '@/components/admin-auth';

function AdminConsole() {
  const [gatewayStatus, setGatewayStatus] = React.useState<GatewayStatus>('connecting');
  const [gatewayLogs, setGatewayLogs] = React.useState<string[]>(['Initialisiere Gateway-Schnittstelle...']);
  const [isConnecting, setIsConnecting] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    const checkInitialStatus = async () => {
      try {
        const result = await getGatewayStatus();
        if (result.isConnected) {
          setGatewayStatus('connected');
          setGatewayLogs(prev => [...prev, 'Bestehende Verbindung zum Gateway erkannt. Simulation läuft.']);
        } else {
          setGatewayStatus('disconnected');
        }
      } catch (error) {
        console.error("Failed to get gateway status", error);
        setGatewayStatus('error');
        setGatewayLogs(prev => [...prev, 'Fehler beim Abrufen des Gateway-Status.']);
      } finally {
        setIsConnecting(false);
      }
    };
    checkInitialStatus();
  }, []);

  const handleConnect = async (settings: ConnectionSettings) => {
    setIsConnecting(true);
    setGatewayStatus('connecting');
    setGatewayLogs(prev => [...prev, `Verbindungsversuch zu ${settings.type === 'serial' ? settings.serialPort : `${settings.ipAddress}:${settings.port}`}...`]);
    
    const result = await connectToGateway(settings);

    if (result.success) {
        setGatewayStatus('connected');
        toast({ title: 'Gateway verbunden', description: result.message });
    } else {
        setGatewayStatus('error');
        toast({ variant: 'destructive', title: 'Verbindungsfehler', description: result.message });
    }
    setGatewayLogs(prev => [...prev, result.message]);
    setIsConnecting(false);
  };

  const handleDisconnect = async () => {
      setIsConnecting(true);
      const result = await disconnectFromGateway();
      setGatewayStatus('disconnected');
      setGatewayLogs(prev => [...prev, result.message]);
      toast({ title: 'Gateway getrennt' });
      setIsConnecting(false);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
       <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6 shrink-0">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/">
                        <ArrowLeft />
                        <span className="sr-only">Zurück zum Dashboard</span>
                    </Link>
                </Button>
                <div className="flex items-center gap-2">
                     <BotMessageSquare className="h-7 w-7 text-primary" />
                     <h1 className="text-xl font-semibold tracking-tight">Admin-Konsole</h1>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <ThemeToggle />
            </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
        <GatewayConfig
            status={gatewayStatus}
            logs={gatewayLogs}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            isConnecting={isConnecting}
        />
        <AdminSettings />
      </main>
    </div>
  );
}


export default function AdminPage() {
    return (
        <AdminAuth>
            <AdminConsole />
        </AdminAuth>
    );
}