'use client';

import * as React from 'react';
import type { MeshUnit } from '@/types/mesh';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, ListTree, Car, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DeviceRegistryProps {
  units: MeshUnit[];
  updateUnit: (unit: MeshUnit) => void;
}

export default function DeviceRegistry({ units, updateUnit }: DeviceRegistryProps) {
  const [editableUnits, setEditableUnits] = React.useState<Record<number, string>>({});
  const { toast } = useToast();

  const handleNameChange = (id: number, name: string) => {
    setEditableUnits(prev => ({ ...prev, [id]: name }));
  };

  const handleSaveName = (unit: MeshUnit) => {
    const newName = editableUnits[unit.id];
    if (newName && newName.trim() && newName.trim() !== unit.name) {
      updateUnit({ ...unit, name: newName.trim() });
      toast({
        title: 'Einheit aktualisiert',
        description: `Der Name der Einheit #${unit.id} wurde zu "${newName.trim()}" geändert.`,
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
          <div className='flex items-center gap-3'>
            <ListTree className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl">Geräteverwaltung</CardTitle>
              <CardDescription>
                Verwalten Sie die Zuordnung von Einheiten-IDs zu Namen. Dies reduziert den Datenverkehr, da nur die ID gesendet werden muss.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead className="w-[120px]">Typ</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-[130px] text-right">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.map(unit => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.id}</TableCell>
                    <TableCell className="flex items-center gap-2">
                        {unit.type === 'Vehicle' ? <Car className="h-4 w-4 text-muted-foreground" /> : <User className="h-4 w-4 text-muted-foreground" />}
                        {unit.type === 'Vehicle' ? 'Fahrzeug' : 'Personal'}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={editableUnits[unit.id] ?? unit.name}
                        onChange={(e) => handleNameChange(unit.id, e.target.value)}
                        className="h-9"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        onClick={() => handleSaveName(unit)}
                        disabled={!editableUnits[unit.id] || editableUnits[unit.id].trim() === unit.name || !editableUnits[unit.id].trim()}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Speichern
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
