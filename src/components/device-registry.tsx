
'use client';

import * as React from 'react';
import type { MeshUnit, UnitType, Group, UnitStatus } from '@/types/mesh';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, ListTree, Car, User, PlusCircle, Settings, SlidersHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CODE_TO_UNIT_STATUS, CODE_TO_UNIT_TYPE } from '@/types/mesh';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import StatusBadge from './status-badge';
import { cn } from '@/lib/utils';

interface DeviceRegistryProps {
  units: MeshUnit[];
  groups: Group[];
  updateUnit: (unit: MeshUnit) => void;
  addUnit: () => void;
  onAssignGroup: (unitId: number, groupId: number | null) => void;
}

const statusTranslations: Record<UnitStatus, string> = {
  Online: 'Online',
  Moving: 'In Bewegung',
  Idle: 'Inaktiv',
  Alarm: 'Alarm',
  Offline: 'Offline',
  Maintenance: 'Wartung',
};

export default function DeviceRegistry({ units, groups, updateUnit, addUnit, onAssignGroup }: DeviceRegistryProps) {
  const [editableUnits, setEditableUnits] = React.useState<Record<number, Partial<MeshUnit>>>({});
  const { toast } = useToast();
  const [openCollapsibleId, setOpenCollapsibleId] = React.useState<number | null>(null);


  const handleUnitChange = (id: number, field: keyof MeshUnit, value: any) => {
    // Special handling for position
    if (field === 'position') {
        setEditableUnits(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                position: { ...(getUnitValue(units.find(u => u.id === id)!, 'position')), ...value }
            }
        }));
        return;
    }

    setEditableUnits(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };
  
  const handleSaveUnit = (originalUnit: MeshUnit) => {
    const changes = editableUnits[originalUnit.id];
    if (changes) {
      const updatedUnit = { ...originalUnit, ...changes };
      updateUnit(updatedUnit);
      
      toast({
        title: 'Einheit aktualisiert',
        description: `Die Daten für Einheit ${updatedUnit.name} wurden gespeichert.`,
      });
      
      setEditableUnits(prev => {
        const newState = { ...prev };
        delete newState[originalUnit.id];
        return newState;
      });

      setOpenCollapsibleId(null); // Close after saving
    }
  };

  const getUnitValue = <K extends keyof MeshUnit>(unit: MeshUnit, field: K): MeshUnit[K] => {
    return editableUnits[unit.id]?.[field] ?? unit[field];
  };

  return (
    <div className="container mx-auto max-w-6xl py-8">
      <Card className="bg-card/50">
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
                <ListTree className="h-8 w-8 text-primary" />
                <div>
                <CardTitle className="text-2xl">Geräte & Konfiguration</CardTitle>
                <CardDescription>
                    Verwalten Sie Einheiten, ihre Konfigurationen und sehen Sie die systemweiten ID-Mappings ein.
                </CardDescription>
                </div>
            </div>
            <Button onClick={addUnit}>
                <PlusCircle className="mr-2"/>
                Neue Einheit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-12">
          <div>
            <h3 className="text-lg font-semibold mb-3">Registrierte Einheiten</h3>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead className="w-[180px]">Typ</TableHead>
                            <TableHead className="w-[140px]">Status</TableHead>
                            <TableHead className="w-[220px]">Gruppe</TableHead>
                            <TableHead className="w-[130px] text-right">Aktionen</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {units.map(unit => {
                        const isBeingEdited = !!editableUnits[unit.id];
                        const isCollapsibleOpen = openCollapsibleId === unit.id;

                        return (
                            <React.Fragment key={unit.id}>
                                <TableRow className={cn("align-middle", isCollapsibleOpen && "border-b-0")}>
                                    <TableCell className="font-medium">{unit.id}</TableCell>
                                    <TableCell>
                                        <Input
                                            value={getUnitValue(unit, 'name')}
                                            onChange={(e) => handleUnitChange(unit.id, 'name', e.target.value)}
                                            className="h-9 border-0 bg-transparent shadow-none focus-visible:bg-background focus-visible:border-input focus-visible:border focus-visible:ring-2"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Select
                                            value={getUnitValue(unit, 'type')}
                                            onValueChange={(value) => handleUnitChange(unit.id, 'type', value as UnitType)}
                                        >
                                            <SelectTrigger className="h-9">
                                            <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                            <SelectItem value="Vehicle">
                                                <div className="flex items-center gap-2">
                                                <Car className="h-4 w-4 text-muted-foreground" />
                                                Fahrzeug
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="Personnel">
                                                <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                Personal
                                                </div>
                                            </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell><StatusBadge status={unit.status} /></TableCell>
                                    <TableCell>
                                        <Select
                                            value={unit.groupId?.toString() || 'none'}
                                            onValueChange={(value) => onAssignGroup(unit.id, value === 'none' ? null : Number(value))}
                                        >
                                            <SelectTrigger className="h-9">
                                                <SelectValue placeholder="Gruppe auswählen" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Keine Gruppe</SelectItem>
                                                {groups.map(group => (
                                                    <SelectItem key={group.id} value={group.id.toString()}>
                                                        {group.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="text-right space-x-1">
                                        <Button size="icon" variant="ghost" className='h-9 w-9' onClick={() => setOpenCollapsibleId(isCollapsibleOpen ? null : unit.id)}>
                                            <SlidersHorizontal className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            onClick={() => handleSaveUnit(unit)}
                                            disabled={!isBeingEdited}
                                        >
                                            <Save className="h-4 w-4 mr-2" />
                                            Speichern
                                        </Button>
                                    </TableCell>
                                </TableRow>
                                {isCollapsibleOpen && (
                                     <TableRow>
                                        <TableCell colSpan={6} className='p-0'>
                                            <div className='bg-muted/50 p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4'>
                                                <div className="space-y-2">
                                                    <Label>Status</Label>
                                                    <Select
                                                        value={getUnitValue(unit, 'status')}
                                                        onValueChange={(status) => handleUnitChange(unit.id, 'status', status as UnitStatus)}
                                                        >
                                                        <SelectTrigger>
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
                                                        type="number"
                                                        value={getUnitValue(unit, 'position').lat}
                                                        onChange={e => handleUnitChange(unit.id, 'position', { lat: parseFloat(e.target.value) })}
                                                        />
                                                        <Input
                                                        type="number"
                                                        value={getUnitValue(unit, 'position').lng}
                                                        onChange={e => handleUnitChange(unit.id, 'position', { lng: parseFloat(e.target.value) })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2 col-span-1 md:col-span-2">
                                                    <Label>Sendeintervall: {getUnitValue(unit, 'sendInterval')}s</Label>
                                                    <Slider
                                                        min={1}
                                                        max={60}
                                                        step={1}
                                                        value={[getUnitValue(unit, 'sendInterval')]}
                                                        onValueChange={value => handleUnitChange(unit.id, 'sendInterval', value[0])}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                                                    <div className="space-y-0.5">
                                                        <Label>Einheit aktivieren</Label>
                                                        <p className="text-xs text-muted-foreground">
                                                            Aktivieren oder deaktivieren Sie die Datenübertragung.
                                                        </p>
                                                    </div>
                                                    <Switch
                                                        checked={getUnitValue(unit, 'isActive')}
                                                        onCheckedChange={checked => handleUnitChange(unit.id, 'isActive', checked)}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                                                    <div className="space-y-0.5">
                                                        <Label>Externe Stromversorgung</Label>
                                                        <p className="text-xs text-muted-foreground">
                                                            Wenn aktiv, lädt die Einheit.
                                                        </p>
                                                    </div>
                                                    <Switch
                                                        checked={getUnitValue(unit, 'isExternallyPowered')}
                                                        onCheckedChange={checked => handleUnitChange(unit.id, 'isExternallyPowered', checked)}
                                                    />
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        )
                    })}
                    </TableBody>
                </Table>
            </div>
          </div>
          
          <div className="border-t pt-8">
            <div className='flex items-center gap-3 mb-4'>
              <Settings className="h-6 w-6 text-primary" />
              <div>
                <h3 className="text-lg font-semibold">System-ID Konfiguration</h3>
                <p className="text-sm text-muted-foreground">
                  Übersicht der systemweiten ID-Mappings. Diese sind für die Kompakt-Darstellung der Netzwerk-Nachrichten notwendig.
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <h4 className="font-semibold mb-2">Einheitentyp-IDs</h4>
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead className="w-[120px]">ID</TableHead>
                                <TableHead>Typ-Bezeichnung</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Object.entries(CODE_TO_UNIT_TYPE).map(([id, name]) => (
                                    <TableRow key={id}>
                                        <TableCell className="font-mono">{id}</TableCell>
                                        <TableCell>{name}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold mb-2">Status-IDs</h4>
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead className="w-[120px]">ID</TableHead>
                                <TableHead>Status-Bezeichnung</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Object.entries(CODE_TO_UNIT_STATUS).map(([id, name]) => (
                                    <TableRow key={id}>
                                        <TableCell className="font-mono">{id}</TableCell>
                                        <TableCell>{name}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    

    