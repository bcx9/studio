'use client';
import * as React from 'react';
import type { MeshUnit } from '@/types/mesh';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface ConfigPanelProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  unit: MeshUnit;
  onSave: (unit: MeshUnit) => void;
}

const statusTranslations: Record<MeshUnit['status'], string> = {
  Online: 'Online',
  Moving: 'In Bewegung',
  Idle: 'Inaktiv',
  Alarm: 'Alarm',
  Offline: 'Offline',
};


export default function ConfigPanel({ isOpen, setIsOpen, unit, onSave }: ConfigPanelProps) {
  const [editedUnit, setEditedUnit] = React.useState(unit);
  const { toast } = useToast();

  React.useEffect(() => {
    setEditedUnit(unit);
  }, [unit]);

  const handleSave = () => {
    onSave(editedUnit);
    toast({
        title: 'Konfiguration gespeichert',
        description: `Die Einstellungen für die Einheit ${editedUnit.name} wurden aktualisiert.`,
    })
  };

  const handleSendTestMessage = () => {
    toast({
        title: `Testnachricht gesendet`,
        description: `Eine Testnachricht wurde für die Einheit ${unit.name} in die Warteschlange gestellt.`,
    })
  }

  const handleFirmwareUpdate = () => {
     toast({
        title: `Firmware-Update vorbereitet`,
        description: `Simulierter Firmware-Update-Befehl an ${unit.name} gesendet.`,
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Konfigurieren: {unit.name}</SheetTitle>
          <SheetDescription>
            Konfigurieren Sie den Mesh-Tracker aus der Ferne. Änderungen werden über das Netzwerk gesendet.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-6 overflow-y-auto p-1 pr-6">
          <div className="space-y-2">
            <Label htmlFor="unit-name">Einheitenname</Label>
            <Input
              id="unit-name"
              value={editedUnit.name}
              onChange={e => setEditedUnit({ ...editedUnit, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit-status">Status</Label>
            <Select
              value={editedUnit.status}
              onValueChange={status => setEditedUnit({ ...editedUnit, status: status as MeshUnit['status'] })}
            >
              <SelectTrigger id="unit-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusTranslations).map(([statusValue, statusLabel]) => (
                    <SelectItem key={statusValue} value={statusValue}>{statusLabel}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
           <div className="space-y-2">
            <Label>Position (Lat/Lon)</Label>
            <div className='flex gap-2'>
            <Input
              id="unit-lat"
              type="number"
              value={editedUnit.position.lat}
              onChange={e => setEditedUnit({ ...editedUnit, position: {...editedUnit.position, lat: parseFloat(e.target.value)} })}
            />
             <Input
              id="unit-lon"
              type="number"
              value={editedUnit.position.lng}
              onChange={e => setEditedUnit({ ...editedUnit, position: {...editedUnit.position, lng: parseFloat(e.target.value)} })}
            />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="send-interval">Sendeintervall: {editedUnit.sendInterval}s</Label>
            <Slider
              id="send-interval"
              min={1}
              max={60}
              step={1}
              value={[editedUnit.sendInterval]}
              onValueChange={value => setEditedUnit({ ...editedUnit, sendInterval: value[0] })}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
                <Label>Einheit aktivieren</Label>
                <p className="text-xs text-muted-foreground">
                    Aktivieren oder deaktivieren Sie die Datenübertragung von dieser Einheit.
                </p>
            </div>
            <Switch
                checked={editedUnit.isActive}
                onCheckedChange={checked => setEditedUnit({ ...editedUnit, isActive: checked })}
            />
          </div>
          <div className='space-y-4'>
            <Button variant="outline" className="w-full" onClick={handleSendTestMessage}>Testnachricht senden</Button>
            <Button variant="secondary" className="w-full" onClick={handleFirmwareUpdate}>Firmware-Update vorbereiten (Simuliert)</Button>
          </div>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Abbrechen</Button>
          <Button onClick={handleSave}>Änderungen speichern</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
