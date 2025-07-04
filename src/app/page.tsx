'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/sidebar';
import AppHeader from '@/components/layout/header';
import { useMeshData } from '@/hooks/use-mesh-data';
import type { MeshUnit } from '@/types/mesh';
import ConfigPanel from '@/components/config-panel';
import AiAnomalyDetector from '@/components/ai-anomaly-detector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import JsonView from '@/components/json-view';
import { Card, CardContent } from '@/components/ui/card';
import { Code, Map } from 'lucide-react';
import DeviceRegistry from '@/components/device-registry';
import GatewayConfig from '@/components/gateway-config';
import type { GatewayStatus, ConnectionSettings } from '@/types/gateway';
import { connectToGateway } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const MapView = dynamic(() => import('@/components/map-view'), {
  ssr: false,
  loading: () => (
     <div className="relative w-full h-full rounded-lg overflow-hidden border bg-background flex items-center justify-center">
        <Skeleton className="w-full h-full" />
        <div className="absolute flex flex-col items-center text-muted-foreground">
          <Map className="h-16 w-16 mb-4 animate-pulse" />
          <p>Lade Karte...</p>
        </div>
      </div>
  )
});


export default function Home() {
  const { units, updateUnit, addUnit, removeUnit } = useMeshData();
  const [selectedUnit, setSelectedUnit] = React.useState<MeshUnit | null>(null);
  const [isConfigPanelOpen, setConfigPanelOpen] = React.useState(false);
  const [highlightedUnitId, setHighlightedUnitId] = React.useState<number | null>(null);

  const [gatewayStatus, setGatewayStatus] = React.useState<GatewayStatus>('disconnected');
  const [gatewayLogs, setGatewayLogs] = React.useState<string[]>(['Initialisiere Gateway-Schnittstelle...']);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const { toast } = useToast();

  const handleConfigureUnit = (unit: MeshUnit) => {
    setSelectedUnit(unit);
    setConfigPanelOpen(true);
  };

  const handleSaveUnitConfig = (updatedUnit: MeshUnit) => {
    updateUnit(updatedUnit);
    setConfigPanelOpen(false);
  };

  const handleCreateNewUnit = () => {
    addUnit();
  };

  const handleDeleteUnit = (unitId: number) => {
    removeUnit(unitId);
    if(selectedUnit?.id === unitId) {
      setConfigPanelOpen(false);
      setSelectedUnit(null);
    }
  }

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

  const handleDisconnect = () => {
      setGatewayStatus('disconnected');
      setGatewayLogs(prev => [...prev, 'Verbindung durch Benutzer getrennt.']);
      toast({ title: 'Gateway getrennt' });
  };


  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar
          units={units}
          onConfigureUnit={handleConfigureUnit}
          onCreateUnit={handleCreateNewUnit}
          onDeleteUnit={handleDeleteUnit}
          onUnitHover={setHighlightedUnitId}
          selectedUnitId={selectedUnit?.id}
          onSelectUnit={setSelectedUnit}
        />
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col h-screen">
          <AppHeader />
          <main className="flex-1 overflow-hidden p-4 md:p-6">
            <Tabs defaultValue="map" className="h-full flex flex-col">
              <TabsList className="mb-4 self-start">
                <TabsTrigger value="map">Live-Karte</TabsTrigger>
                <TabsTrigger value="ai-monitor">KI-Anomalieerkennung</TabsTrigger>
                <TabsTrigger value="device-registry">Geräteverwaltung</TabsTrigger>
                <TabsTrigger value="gateway-config">Gateway-Konfiguration</TabsTrigger>
                <TabsTrigger value="json-view" disabled={!selectedUnit}>
                  Datenansicht
                </TabsTrigger>
              </TabsList>
              <TabsContent forceMount value="map" className="flex-1 overflow-hidden rounded-lg">
                <MapView units={units} highlightedUnitId={highlightedUnitId} />
              </TabsContent>
              <TabsContent forceMount value="ai-monitor" className="flex-1 overflow-y-auto">
                <AiAnomalyDetector units={units} />
              </TabsContent>
               <TabsContent forceMount value="device-registry" className="flex-1 overflow-y-auto">
                <DeviceRegistry 
                    units={units} 
                    updateUnit={updateUnit} 
                    addUnit={handleCreateNewUnit} 
                />
              </TabsContent>
               <TabsContent forceMount value="gateway-config" className="flex-1 overflow-y-auto">
                <GatewayConfig
                    status={gatewayStatus}
                    logs={gatewayLogs}
                    onConnect={handleConnect}
                    onDisconnect={handleDisconnect}
                    isConnecting={isConnecting}
                />
              </TabsContent>
               <TabsContent forceMount value="json-view" className="flex-1 overflow-y-auto">
                {selectedUnit ? (
                  <JsonView unit={selectedUnit} />
                ) : (
                  <Card className="h-full flex items-center justify-center bg-card/50 border-dashed">
                    <CardContent className="text-center text-muted-foreground pt-6">
                      <Code className="mx-auto h-12 w-12 mb-4" />
                      <p>Wählen Sie eine Einheit aus der Liste aus, um die Rohdaten anzuzeigen.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </SidebarInset>
      {selectedUnit && (
        <ConfigPanel
          isOpen={isConfigPanelOpen}
          setIsOpen={setConfigPanelOpen}
          unit={selectedUnit}
          onSave={handleSaveUnitConfig}
        />
      )}
    </SidebarProvider>
  );
}
