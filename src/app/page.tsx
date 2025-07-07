
'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/sidebar';
import AppHeader from '@/components/layout/header';
import { useMeshData } from '@/hooks/use-mesh-data';
import type { MeshUnit, StatusMapping, TypeMapping } from '@/types/mesh';
import AiAnomalyDetector from '@/components/ai-anomaly-detector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import JsonView from '@/components/json-view';
import { Card, CardContent } from '@/components/ui/card';
import { Code, Map as MapIcon, ListTree, BrainCircuit } from 'lucide-react';
import DeviceRegistry from '@/components/device-registry';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import LeitstelleConfigPanel from '@/components/leitstelle-config-panel';
import GroupManagement from '@/components/group-management';

const MapView = dynamic(() => import('@/components/map-view'), {
  ssr: false,
  loading: () => (
    <div className="relative w-full h-full rounded-lg overflow-hidden border border-primary/20 bg-background flex items-center justify-center">
      <Skeleton className="w-full h-full" />
      <div className="absolute flex flex-col items-center text-muted-foreground">
        <MapIcon className="h-16 w-16 animate-pulse text-primary" />
        <p className='font-headline mt-2'>Lade Karte...</p>
      </div>
    </div>
  ),
});

const TACTICAL_DRAWINGS_KEY = 'tactical-drawings';

export default function Home() {
  const [selectedUnit, setSelectedUnit] = React.useState<MeshUnit | null>(null);
  const [isLeitstellePanelOpen, setLeitstellePanelOpen] = React.useState(false);
  const [highlightedUnitId, setHighlightedUnitId] = React.useState<number | null>(null);
  
  const [controlCenterPosition, setControlCenterPosition] = React.useState<{ lat: number; lng: number } | null>({ lat: 53.19745, lng: 10.84507 });
  const [isRallying, setIsRallying] = React.useState(false);
  const [isPositioningMode, setIsPositioningMode] = React.useState(false);

  const { toast } = useToast();

  const [drawnItems, setDrawnItems] = React.useState<any[]>([]);

  React.useEffect(() => {
    try {
        const savedDrawings = localStorage.getItem(TACTICAL_DRAWINGS_KEY);
        if (savedDrawings) {
            setDrawnItems(JSON.parse(savedDrawings));
        }
    } catch(e) {
        console.error("Failed to load drawings from localStorage", e);
        localStorage.removeItem(TACTICAL_DRAWINGS_KEY);
    }
  }, []);

  const handleUnitMessage = React.useCallback((unitName: string, message: string) => {
    toast({
        title: `Nachricht von ${unitName}`,
        description: message,
    });
  }, [toast]);

  const { 
      units, 
      updateUnit, 
      addUnit, 
      removeUnit, 
      chargeUnit, 
      isInitialized, 
      sendMessage, 
      groups,
      addGroup,
      updateGroup,
      removeGroup,
      assignUnitToGroup,
      repositionAllUnits,
      typeMapping,
      statusMapping,
   } = useMeshData({ 
    onUnitMessage: handleUnitMessage,
    isRallying,
    controlCenterPosition,
   });

  const handleDeleteUnit = (unitId: number) => {
    removeUnit(unitId);
    if(selectedUnit?.id === unitId) {
      setSelectedUnit(null);
    }
  }
  
  const handleMapClick = React.useCallback((position: { lat: number; lng: number }) => {
    if (isPositioningMode) {
      setControlCenterPosition(position);
      toast({
          title: 'Leitstelle positioniert',
          description: `Die Position wurde auf der Karte festgelegt.`,
      });
      setIsPositioningMode(false); // Deactivate after setting
    }
  }, [isPositioningMode, toast]);
  
  const handleTogglePositioningMode = () => {
    const nextState = !isPositioningMode;
    setIsPositioningMode(nextState);
    if (nextState) {
        toast({
            title: 'Positionierungsmodus aktiv',
            description: 'Klicken Sie auf die Karte, um die Position der Leitstelle festzulegen.',
        });
    }
  };

  const handleMapUnitClick = (unitId: number) => {
    const unit = units.find(u => u.id === unitId);
    if (unit) {
      setSelectedUnit(unit);
    }
  };

  const handleSendMessage = (message: string, target: 'all' | number) => {
    sendMessage(message, target);
    const targetGroup = groups.find(g => g.id === target);
    toast({
      title: `Rundnachricht gesendet`,
      description: `Ihre Nachricht wurde an ${target === 'all' ? 'alle aktiven Einheiten' : `Gruppe '${targetGroup?.name}'`} übermittelt.`,
    });
  };
  
  const handleToggleRally = () => {
    if (!controlCenterPosition && !isRallying) {
      toast({
          variant: 'destructive',
          title: 'Sammelpunkt nicht gesetzt',
          description: 'Bitte klicken Sie zuerst auf die Karte, um die Position der Leitstelle festzulegen.',
      });
      return;
    }
    const newRallyState = !isRallying;
    setIsRallying(newRallyState);
    toast({
        title: `Sammelbefehl ${newRallyState ? 'aktiviert' : 'deaktiviert'}`,
        description: newRallyState 
            ? 'Alle Einheiten bewegen sich nun zur Leitstelle.'
            : 'Alle Einheiten setzen ihre vorherigen Operationen fort.',
    });
  };

  const handleRepositionAllUnits = (radius: number) => {
    if (!controlCenterPosition) {
        toast({
            variant: 'destructive',
            title: 'Leitstelle nicht positioniert',
            description: 'Bitte klicken Sie zuerst auf die Karte, um die Position der Leitstelle festzulegen.',
        });
        return;
    }
    repositionAllUnits(radius);
    toast({
        title: 'Einheiten neu positioniert',
        description: `Alle Einheiten wurden in einem ${radius}km-Umkreis um die Leitstelle neu positioniert.`,
    });
  };

  const handleShapesChange = (featureGroup: any) => {
    const geoJsonData = featureGroup.toGeoJSON();
    const features = geoJsonData.features || [];
    setDrawnItems(features);
    try {
        localStorage.setItem(TACTICAL_DRAWINGS_KEY, JSON.stringify(features));
    } catch (e) {
        console.error("Failed to save drawings to localStorage", e);
    }
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar
          units={units}
          groups={groups}
          onCreateUnit={addUnit}
          onDeleteUnit={handleDeleteUnit}
          onChargeUnit={chargeUnit}
          onUnitHover={setHighlightedUnitId}
          selectedUnitId={selectedUnit?.id}
          onSelectUnit={setSelectedUnit}
          controlCenterPosition={controlCenterPosition}
          onConfigureLeitstelle={() => setLeitstellePanelOpen(true)}
          isPositioningMode={isPositioningMode}
          onTogglePositioningMode={handleTogglePositioningMode}
          statusMapping={statusMapping}
        />
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col h-screen">
          <AppHeader />
          <main className="flex-1 overflow-hidden p-4 md:p-6 flex flex-col">
            <Tabs defaultValue="map" className="h-full flex flex-col">
              <TabsList className="mb-4 self-start">
                <TabsTrigger value="map"><MapIcon className="mr-2 h-4 w-4"/>Live-Karte</TabsTrigger>
                <TabsTrigger value="ai-monitor"><BrainCircuit className="mr-2 h-4 w-4"/>KI-Anomalieerkennung</TabsTrigger>
                <TabsTrigger value="device-registry"><ListTree className="mr-2 h-4 w-4"/>Geräte & System</TabsTrigger>
                <TabsTrigger value="group-management">Gruppenverwaltung</TabsTrigger>
                <TabsTrigger value="json-view" disabled={!selectedUnit}>
                  Datenansicht
                </TabsTrigger>
              </TabsList>
              <TabsContent value="map" className="flex-1 overflow-hidden rounded-lg data-[state=inactive]:hidden" forceMount>
                {isInitialized ? (
                  <MapView 
                    units={units} 
                    highlightedUnitId={highlightedUnitId} 
                    onMapClick={handleMapClick}
                    onUnitClick={handleMapUnitClick}
                    controlCenterPosition={controlCenterPosition}
                    drawnItems={drawnItems}
                    onShapesChange={handleShapesChange}
                    isPositioningMode={isPositioningMode}
                  />
                ) : (
                   <div className="relative w-full h-full rounded-lg overflow-hidden border border-primary/20 bg-background flex items-center justify-center">
                    <Skeleton className="w-full h-full" />
                    <div className="absolute flex flex-col items-center text-muted-foreground">
                      <MapIcon className="h-16 w-16 mb-4 animate-pulse text-primary" />
                      <p className="font-headline">Warte auf Verbindung zum Backend...</p>
                    </div>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="ai-monitor" className="flex-1 overflow-y-auto">
                <AiAnomalyDetector />
              </TabsContent>
               <TabsContent value="device-registry" className="flex-1 overflow-y-auto">
                <DeviceRegistry 
                    units={units} 
                    updateUnit={updateUnit} 
                    addUnit={addUnit} 
                    groups={groups}
                    onAssignGroup={assignUnitToGroup}
                    statusMapping={statusMapping}
                    typeMapping={typeMapping}
                />
              </TabsContent>
                <TabsContent value="group-management" className="flex-1 overflow-y-auto">
                    <GroupManagement 
                        groups={groups}
                        onAddGroup={addGroup}
                        onUpdateGroup={updateGroup}
                        onRemoveGroup={removeGroup}
                        onRepositionAllUnits={handleRepositionAllUnits}
                        isRepositionPossible={!!controlCenterPosition}
                    />
                </TabsContent>
               <TabsContent value="json-view" className="flex-1 overflow-y-auto">
                {selectedUnit ? (
                  <JsonView unit={selectedUnit} typeMapping={typeMapping} statusMapping={statusMapping} />
                ) : (
                  <Card className="h-full flex items-center justify-center bg-transparent border-dashed">
                    <CardContent className="text-center text-muted-foreground pt-6">
                      <Code className="mx-auto h-12 w-12 mb-4" />
                      <p>Wählen Sie eine Einheit aus der Liste oder auf der Karte aus, um die Rohdaten anzuzeigen.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </SidebarInset>
      <LeitstelleConfigPanel
        isOpen={isLeitstellePanelOpen}
        setIsOpen={setLeitstellePanelOpen}
        onSendMessage={handleSendMessage}
        isRallying={isRallying}
        onToggleRally={handleToggleRally}
        isRallyPossible={!!controlCenterPosition}
        groups={groups}
      />
    </SidebarProvider>
  );
}
