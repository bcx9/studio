'use client';

import * as React from 'react';
import type { MeshUnit, UnitType } from '@/types/mesh';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, ListTree, Car, User, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DeviceRegistryProps {
  units: MeshUnit[];
  updateUnit: (unit: MeshUnit) => void;
  addUnit: () => void;
}

export default function DeviceRegistry({ units, updateUnit, addUnit }: DeviceRegistryProps) {
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
    <div className="container mx-auto max-w-4xl py-8">
      <Card className="bg-card/50">
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
                <ListTree className="h-8 w-8 text-primary" />
                <div>
                <CardTitle className="text-2xl">Geräteverwaltung</CardTitle>
                <CardDescription>
                    Verwalten und erstellen Sie Einheiten. Namen und Typen werden an der Leitstelle mit der ID verknüpft, um den Datenverkehr zu reduzieren.
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
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-[200px]">Typ</TableHead>
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
        </CardContent>
      </Card>
    </div>
  );
}
