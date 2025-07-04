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

export default function ConfigPanel({ isOpen, setIsOpen, unit, onSave }: ConfigPanelProps) {
  const [editedUnit, setEditedUnit] = React.useState(unit);
  const { toast } = useToast();

  React.useEffect(() => {
    setEditedUnit(unit);
  }, [unit]);

  const handleSave = () => {
    onSave(editedUnit);
    toast({
        title: 'Configuration Saved',
        description: `Settings for unit ${editedUnit.name} have been updated.`,
    })
  };

  const handleSendTestMessage = () => {
    toast({
        title: `Test Message Sent`,
        description: `A test message has been queued for unit ${unit.name}.`,
    })
  }

  const handleFirmwareUpdate = () => {
     toast({
        title: `Firmware Update Prepared`,
        description: `Simulated firmware update command sent to ${unit.name}.`,
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Configure: {unit.name}</SheetTitle>
          <SheetDescription>
            Remotely configure the mesh tracker. Changes will be sent over the network.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-6 overflow-y-auto p-1 pr-6">
          <div className="space-y-2">
            <Label htmlFor="unit-name">Unit Name</Label>
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
                <SelectItem value="Online">Online</SelectItem>
                <SelectItem value="Moving">Moving</SelectItem>
                <SelectItem value="Idle">Idle</SelectItem>
                <SelectItem value="Alarm">Alarm</SelectItem>
                <SelectItem value="Offline">Offline</SelectItem>
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
            <Label htmlFor="send-interval">Send Interval: {editedUnit.sendInterval}s</Label>
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
                <Label>Activate Unit</Label>
                <p className="text-xs text-muted-foreground">
                    Enable or disable data transmission from this unit.
                </p>
            </div>
            <Switch
                checked={editedUnit.isActive}
                onCheckedChange={checked => setEditedUnit({ ...editedUnit, isActive: checked })}
            />
          </div>
          <div className='space-y-4'>
            <Button variant="outline" className="w-full" onClick={handleSendTestMessage}>Send Test Message</Button>
            <Button variant="secondary" className="w-full" onClick={handleFirmwareUpdate}>Prepare Firmware Update (Simulated)</Button>
          </div>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
