
'use client';

import * as React from 'react';
import type { MeshUnit, UnitType, Group, UnitStatus, StatusMapping, TypeMapping } from '@/types/mesh';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, ListTree, Car, User, PlusCircle, Settings, SlidersHorizontal, Box } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  statusMapping: StatusMapping;
  typeMapping: TypeMapping;
}

export default function DeviceRegistry({ units, groups, updateUnit, addUnit, onAssignGroup, statusMapping, typeMapping }: DeviceRegistryProps) {
  const [editableUnits, setEditableUnits] = React.useState<Record<number, Partial<MeshUnit>>>({});
  const { toast } = useToast();
  const [openConfigId, setOpenConfigId] = React.useState<number | null>(null);


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

      setOpenConfigId(null); // Close after saving
    }
  };

  const getUnitValue = <K extends keyof MeshUnit>(unit: MeshUnit, field: K): MeshUnit[K] => {
    return editableUnits[unit.id]?.[field] ?? unit[field];
  };

  return (
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
                <ListTree className="h-6 w-6 text-primary" />
                <div>
                <CardTitle className="text-xl">Geräte-Register</CardTitle>
                <CardDescription>
                    Konfigurieren und gruppieren Sie Ihre Einheiten.
                </CardDescription>
                </div>
            </div>
            <Button onClick={addUnit}>
                <PlusCircle className="mr-2"/>
                Neue Einheit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
            <div className="border-none rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow className='border-b-0'>
                            <TableHead className="w-[80px]">ID</TableHead>
                            <TableHead className="min-w-[200px]">Name</TableHead>
                            <TableHead className="w-[180px]">Typ</TableHead>
                            <TableHead className="w-[140px]">Status</TableHead>
                            <TableHead className="w-[220px]">Gruppe</TableHead>
                            <TableHead className="w-[130px] text-right">Aktionen</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {units.map(unit => {
                        const isBeingEdited = !!editableUnits[unit.id];
                        const isConfigOpen = openConfigId === unit.id;

                        return (
                            <React.Fragment key={unit.id}>
                                <TableRow className={cn("align-middle border-b-0", isConfigOpen && "bg-secondary/50")}>
                                    <TableCell className="font-medium">{unit.id}</TableCell>
                                    <TableCell>
                                        <Input
                                            value={getUnitValue(unit, 'name')}
                                            onChange={(e) => handleUnitChange(unit.id, 'name', e.target.value)}
                                            className="h-9"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Select
                                            value={getUnitValue(unit, 'type')}
                                            onValueChange={(value) => handleUnitChange(unit.id, 'type', value)}
                                        >
                                            <SelectTrigger className="h-9">
                                            <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                            {Object.values(typeMapping).map(typeName => (
                                                <SelectItem key={typeName} value={typeName}>
                                                    <div className="flex items-center gap-2">
                                                        {typeName === 'Vehicle' && <Car className="h-4 w-4 text-muted-foreground" />}
                                                        {typeName === 'Personnel' && <User className="h-4 w-4 text-muted-foreground" />}
                                                        {typeName !== 'Vehicle' && typeName !== 'Personnel' && <Box className="h-4 w-4 text-muted-foreground" />}
                                                        {typeName}
                                                    </div>
                                                </SelectItem>
                                            ))}
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
                                        <Button size="icon" variant={isConfigOpen ? 'secondary' : 'ghost'} className='h-9 w-9 rounded-full' onClick={() => setOpenConfigId(isConfigOpen ? null : unit.id)}>
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
                                {isConfigOpen && (
                                     <TableRow className='bg-secondary/50'>
                                        <TableCell colSpan={6} className='p-0'>
                                            <div className='p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6'>
                                                <div className="space-y-3">
                                                    <Label>Status</Label>
                                                    <Select
                                                        value={getUnitValue(unit, 'status')}
                                                        onValueChange={(status) => handleUnitChange(unit.id, 'status', status)}
                                                        >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {Object.values(statusMapping).map((statusLabel) => (
                                                                <SelectItem key={statusLabel} value={statusLabel}>{statusLabel}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-3">
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
                                                <div className="space-y-3 col-span-1 md:col-span-2">
                                                    <Label>Sendeintervall: {getUnitValue(unit, 'sendInterval')}s</Label>
                                                    <Slider
                                                        min={1}
                                                        max={60}
                                                        step={1}
                                                        value={[getUnitValue(unit, 'sendInterval')]}
                                                        onValueChange={value => handleUnitChange(unit.id, 'sendInterval', value[0])}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between rounded-lg p-3 neumorphic-shadow-inset bg-background">
                                                    <div className="space-y-0.5">
                                                        <Label>Einheit aktivieren</Label>
                                                        <p className="text-xs text-muted-foreground">
                                                            Datenübertragung aktivieren/deaktivieren.
                                                        </p>
                                                    </div>
                                                    <Switch
                                                        checked={getUnitValue(unit, 'isActive')}
                                                        onCheckedChange={checked => handleUnitChange(unit.id, 'isActive', checked)}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between rounded-lg p-3 neumorphic-shadow-inset bg-background">
                                                    <div className="space-y-0.5">
                                                        <Label>Externe Stromversorgung</Label>
                                                        <p className="text-xs text-muted-foreground">
                                                            Simuliert das Laden der Einheit.
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
        </CardContent>
      </Card>
  );
}
