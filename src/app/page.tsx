
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
import { setControlCenterPositionOnBackend, setRallyingOnBackend } from './actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const MapView = dynamic(() => import('@/components/map-view'), {
  ssr: false,
  loading: () => (
    <div className="relative w-full h-full bg-background flex items-center justify-center">
      <Skeleton className="w-full h-full" />
      <div className="absolute flex flex-col items-center text-muted-foreground">
        <MapIcon className="h-16 w-16 animate-pulse text-primary" />
        <p className='mt-2'>Lade Karte...</p>
      </div>
    </div>
  ),
});

const TACTICAL_DRAWINGS_KEY = 'tactical-drawings';

type AssignmentState = {
  type: 'patrol' | 'pendulum';
  groupId: number;
  groupName: string;
  points: { lat: number; lng: number }[];
  radius: number;
}

export default function Home() {
  const [selectedUnit, setSelectedUnit] = React.useState<MeshUnit | null>(null);
  const [isLeitstellePanelOpen, setLeitstellePanelOpen] = React.useState(false);
  const [highlightedUnitId, setHighlightedUnitId] = React.useState<number | null>(null);
  
  const [controlCenterPosition, setControlCenterPosition] = React.useState<{ lat: number; lng: number } | null>({ lat: 53.19745, lng: 10.84507 });
  const [isRallying, setIsRallying] = React.useState(false);
  const [isPositioningMode, setIsPositioningMode] = React.useState(false);
  const [assignmentState, setAssignmentState] = React.useState<AssignmentState | null>(null);
  const [unitToDelete, setUnitToDelete] = React.useState<MeshUnit | null>(null);

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
      assignments,
      assignPatrolToGroup,
      assignPendulumToGroup,
      removeAssignmentFromGroup,
   } = useMeshData({ 
    onUnitMessage: handleUnitMessage,
   });

  const handleDeleteRequest = (unitId: number) => {
    const unit = units.find(u => u.id === unitId);
    if(unit) setUnitToDelete(unit);
  }

  const confirmDeleteUnit = () => {
    if (unitToDelete) {
      removeUnit(unitToDelete.id);
      toast({
          title: 'Einheit gelöscht',
          description: `Die Einheit ${unitToDelete.name} wurde entfernt.`
      })
      if (selectedUnit?.id === unitToDelete.id) {
        setSelectedUnit(null);
      }
      setUnitToDelete(null);
    }
  }

  const handleChargeUnit = (unitId: number) => {
    chargeUnit(unitId);
    const unit = units.find(u => u.id === unitId);
    if (unit) {
        toast({
            title: 'Einheit wird geladen',
            description: `Der Akku von ${unit.name} wird auf 100% gesetzt.`
        });
    }
  };
  
  const handleMapClick = React.useCallback((position: { lat: number; lng: number } | null) => {
    if (!position) {
        setSelectedUnit(null);
        return;
    }
    
    if (assignmentState) {
      if (assignmentState.type === 'patrol') {
        assignPatrolToGroup(assignmentState.groupId, position, assignmentState.radius);
        toast({
          title: 'Patrouille zugewiesen',
          description: `Gruppe "${assignmentState.groupName}" patrouilliert nun um die neue Position.`,
        });
        setAssignmentState(null);
      } else if (assignmentState.type === 'pendulum') {
        const newPoints = [...assignmentState.points, position];
        if (newPoints.length === 2) {
          assignPendulumToGroup(assignmentState.groupId, newPoints);
          toast({
            title: 'Pendelroute zugewiesen',
            description: `Gruppe "${assignmentState.groupName}" pendelt nun zwischen den zwei Punkten.`,
          });
          setAssignmentState(null);
        } else {
          setAssignmentState({ ...assignmentState, points: newPoints });
          toast({
            title: `Punkt 1 für ${assignmentState.groupName} gesetzt`,
            description: 'Klicken Sie auf die Karte, um den zweiten Punkt der Route festzulegen.',
          });
        }
      }
    } else if (isPositioningMode) {
      setControlCenterPosition(position);
      setControlCenterPositionOnBackend(position);
      toast({
          title: 'Leitstelle positioniert',
          description: `Die Position wurde auf der Karte festgelegt.`,
      });
      setIsPositioningMode(false); // Deactivate after setting
    }
  }, [isPositioningMode, toast, assignmentState, assignPatrolToGroup, assignPendulumToGroup]);

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
  
  const handleStartAssignment = (type: 'patrol' | 'pendulum', groupId: number, groupName: string, radius = 1.5) => {
    setAssignmentState({ type, groupId, groupName, points: [], radius });
    if (type === 'patrol') {
      toast({
        title: `Befehlsmodus: Patrouille für ${groupName}`,
        description: `Radius: ${radius}km. Klicken Sie auf die Karte, um das Zentrum festzulegen.`,
      });
    } else {
      toast({
        title: `Befehlsmodus: Pendelroute für ${groupName}`,
        description: 'Klicken Sie auf die Karte, um den Startpunkt der Route festzulegen.',
      });
    }
  };


  const handleRemoveAssignment = (groupId: number) => {
    removeAssignmentFromGroup(groupId);
    toast({
      title: 'Befehl aufgehoben',
      description: 'Die Gruppe hat ihre zugewiesene Aufgabe beendet.',
    });
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
    setRallyingOnBackend(newRallyState);
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
    <div className="main-background">
      <SidebarProvider>
        <Sidebar>
          <AppSidebar
            units={units}
            groups={groups}
            onCreateUnit={addUnit}
            onDeleteUnit={handleDeleteRequest}
            onChargeUnit={handleChargeUnit}
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
            <main className="flex-1 overflow-hidden flex flex-col p-0">
              <Tabs defaultValue="map" className="h-full flex flex-col">
                <div className="px-4 md:px-6 pt-4">
                  <TabsList className="mb-4 self-start">
                    <TabsTrigger value="map"><MapIcon className="mr-2 h-4 w-4"/>Live-Karte</TabsTrigger>
                    <TabsTrigger value="ai-monitor"><BrainCircuit className="mr-2 h-4 w-4"/>KI-Analyse</TabsTrigger>
                    <TabsTrigger value="device-registry"><ListTree className="mr-2 h-4 w-4"/>Geräte & Gruppen</TabsTrigger>
                    <TabsTrigger value="json-view" disabled={!selectedUnit}>
                      Rohdaten
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="map" className="data-[state=inactive]:hidden p-4 pt-0 md:p-0 md:pt-0" forceMount>
                  <div className="w-full aspect-video rounded-lg overflow-hidden shadow-lg">
                    {isInitialized ? (
                      <MapView 
                        units={units} 
                        highlightedUnitId={highlightedUnitId} 
                        selectedUnit={selectedUnit}
                        onMapClick={handleMapClick}
                        onUnitClick={handleMapUnitClick}
                        onUnitCharge={handleChargeUnit}
                        onUnitDelete={handleDeleteRequest}
                        controlCenterPosition={controlCenterPosition}
                        drawnItems={drawnItems}
                        onShapesChange={handleShapesChange}
                        isPositioningMode={isPositioningMode || !!assignmentState}
                        assignments={assignments}
                      />
                    ) : (
                      <div className="relative w-full h-full bg-background flex items-center justify-center">
                        <Skeleton className="w-full h-full" />
                        <div className="absolute flex flex-col items-center text-muted-foreground">
                          <MapIcon className="h-16 w-16 mb-4 animate-pulse text-primary" />
                          <p>Warte auf Verbindung zum Backend...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="ai-monitor" className="flex-1 overflow-y-auto p-4 md:p-6">
                  <AiAnomalyDetector />
                </TabsContent>
                <TabsContent value="device-registry" className="flex-1 overflow-y-auto p-4 md:p-6">
                  <div className="grid grid-cols-1 gap-8">
                    <DeviceRegistry 
                        units={units} 
                        updateUnit={updateUnit} 
                        addUnit={addUnit} 
                        groups={groups}
                        onAssignGroup={assignUnitToGroup}
                        statusMapping={statusMapping}
                        typeMapping={typeMapping}
                    />
                    <GroupManagement 
                        groups={groups}
                        onAddGroup={addGroup}
                        onUpdateGroup={updateGroup}
                        onRemoveGroup={removeGroup}
                        onRepositionAllUnits={handleRepositionAllUnits}
                        isRepositionPossible={!!controlCenterPosition}
                        assignments={assignments}
                        onStartAssignment={handleStartAssignment}
                        onRemoveAssignment={handleRemoveAssignment}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="json-view" className="flex-1 overflow-y-auto p-4 md:p-6">
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
        <AlertDialog open={!!unitToDelete} onOpenChange={(open) => !open && setUnitToDelete(null)}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
                  <AlertDialogDescription>
                      Möchten Sie die Einheit "{unitToDelete?.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setUnitToDelete(null)}>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmDeleteUnit} className="bg-destructive hover:bg-destructive/90">Löschen</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
      </SidebarProvider>
    </div>
  );
}
