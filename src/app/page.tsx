'use client';

import * as React from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/sidebar';
import AppHeader from '@/components/layout/header';
import MapView from '@/components/map-view';
import { useMeshData } from '@/hooks/use-mesh-data';
import type { MeshUnit } from '@/types/mesh';
import ConfigPanel from '@/components/config-panel';
import AiAnomalyDetector from '@/components/ai-anomaly-detector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import JsonView from '@/components/json-view';
import { Card, CardContent } from '@/components/ui/card';
import { Code } from 'lucide-react';
import DeviceRegistry from '@/components/device-registry';

export default function Home() {
  const { units, updateUnit, addUnit, removeUnit } = useMeshData();
  const [selectedUnit, setSelectedUnit] = React.useState<MeshUnit | null>(null);
  const [isConfigPanelOpen, setConfigPanelOpen] = React.useState(false);
  const [highlightedUnitId, setHighlightedUnitId] = React.useState<number | null>(null);

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
                <TabsTrigger value="json-view" disabled={!selectedUnit}>
                  Datenansicht
                </TabsTrigger>
              </TabsList>
              <TabsContent value="map" className="flex-1 overflow-hidden rounded-lg">
                <MapView units={units} highlightedUnitId={highlightedUnitId} />
              </TabsContent>
              <TabsContent value="ai-monitor" className="flex-1 overflow-y-auto">
                <AiAnomalyDetector units={units} />
              </TabsContent>
               <TabsContent value="device-registry" className="flex-1 overflow-y-auto">
                <DeviceRegistry units={units} updateUnit={updateUnit} />
              </TabsContent>
               <TabsContent value="json-view" className="flex-1 overflow-y-auto">
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
