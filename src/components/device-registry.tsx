
'use client';

import * as React from 'react';
import type { MeshUnit, UnitType, Group } from '@/types/mesh';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, ListTree, Car, User, PlusCircle, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CODE_TO_UNIT_STATUS, CODE_TO_UNIT_TYPE } from '@/types/mesh';

interface DeviceRegistryProps {
  units: MeshUnit[];
  groups: Group[];
  updateUnit: (unit: MeshUnit) => void;
  addUnit: () => void;
  onAssignGroup: (unitId: number, groupId: number | null) => void;
}

export default function DeviceRegistry({ units, groups, updateUnit, addUnit, onAssignGroup }: DeviceRegistryProps) {
  const [editableUnits, setEditableUnits] = React.useState<Record<number, Partial<Pick<MeshUnit, 'name' | 'type'>>>>({});
  const { toast } = useToast();

  const handleUnitChange = (id: number, field: 'name' | 'type', value: string) => {
    setEditableUnits(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleSaveUnit = (unit: MeshUnit) => {
    const changes = editableUnits[unit.id];
    if (changes) {
      const updatedUnit = { ...unit, ...changes };
      updateUnit(updatedUnit);
      
      toast({
        title: 'Einheit aktualisiert',
        description: `Die Daten für Einheit #${unit.id} wurden gespeichert.`,
      });
      
      setEditableUnits(prev => {
        const newState = { ...prev };
        delete newState[unit.id];
        return newState;
      });
    }
  };

  return (
    <div className="container mx-auto max-w-5xl py-8">
      <Card className="bg-card/50">
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
                <ListTree className="h-8 w-8 text-primary" />
                <div>
                <CardTitle className="text-2xl">Geräte & System</CardTitle>
                <CardDescription>
                    Verwalten Sie Einheiten und sehen Sie die systemweiten ID-Konfigurationen ein.
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
            <div className="border rounded-lg overflow-hidden">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-[180px]">Typ</TableHead>
                    <TableHead className="w-[220px]">Gruppe</TableHead>
                    <TableHead className="w-[130px] text-right">Aktion</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {units.map(unit => {
                    const unitChanges = editableUnits[unit.id] || {};
                    const newName = unitChanges.name;
                    const newType = unitChanges.type;
                    
                    const isNameChanged = newName !== undefined && newName.trim() && newName.trim() !== unit.name;
                    const isTypeChanged = newType !== undefined && newType !== unit.type;
                    const isSavable = isNameChanged || isTypeChanged;
                    
                    return (
                    <TableRow key={unit.id}>
                        <TableCell className="font-medium">{unit.id}</TableCell>
                        <TableCell>
                        <Input
                            value={newName ?? unit.name}
                            onChange={(e) => handleUnitChange(unit.id, 'name', e.target.value)}
                            className="h-9"
                        />
                        </TableCell>
                        <TableCell>
                        <Select
                            value={newType ?? unit.type}
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
                        <TableCell className="text-right">
                        <Button 
                            size="sm" 
                            onClick={() => handleSaveUnit(unit)}
                            disabled={!isSavable}
                        >
                            <Save className="h-4 w-4 mr-2" />
                            Speichern
                        </Button>
                        </TableCell>
                    </TableRow>
                    )})}
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
