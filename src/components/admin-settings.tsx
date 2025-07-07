
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Settings, Save, X, Edit, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_CODE_TO_UNIT_STATUS, DEFAULT_CODE_TO_UNIT_TYPE, type TypeMapping, type StatusMapping } from '@/types/mesh';

const CONFIG_STORAGE_KEY = 'mesh-config-data';

export default function AdminSettings() {
  const [typeMapping, setTypeMapping] = React.useState<TypeMapping>({});
  const [statusMapping, setStatusMapping] = React.useState<StatusMapping>({});
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingValue, setEditingValue] = React.useState('');
  const { toast } = useToast();

  React.useEffect(() => {
    try {
      const storedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (storedConfig) {
        const { typeMapping: storedTypes, statusMapping: storedStatus } = JSON.parse(storedConfig);
        setTypeMapping(storedTypes || DEFAULT_CODE_TO_UNIT_TYPE);
        setStatusMapping(storedStatus || DEFAULT_CODE_TO_UNIT_STATUS);
      } else {
        setTypeMapping(DEFAULT_CODE_TO_UNIT_TYPE);
        setStatusMapping(DEFAULT_CODE_TO_UNIT_STATUS);
      }
    } catch (error) {
      console.error("Failed to load config from localStorage", error);
      setTypeMapping(DEFAULT_CODE_TO_UNIT_TYPE);
      setStatusMapping(DEFAULT_CODE_TO_UNIT_STATUS);
    }
  }, []);

  const saveConfig = () => {
    try {
      const configToSave = { typeMapping, statusMapping };
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(configToSave));
      toast({ title: 'Konfiguration gespeichert', description: 'Die System-Mappings wurden erfolgreich aktualisiert.' });
    } catch (error) {
      console.error("Failed to save config to localStorage", error);
      toast({ variant: 'destructive', title: 'Fehler beim Speichern', description: 'Die Konfiguration konnte nicht gespeichert werden.' });
    }
  };
  
  const handleStartEditing = (type: 'type' | 'status', id: string) => {
    setEditingId(`${type}-${id}`);
    setEditingValue(type === 'type' ? typeMapping[Number(id)] : statusMapping[Number(id)]);
  };

  const handleCancelEditing = () => {
    setEditingId(null);
    setEditingValue('');
  };
  
  const handleSaveEditing = () => {
    if (!editingId) return;
    const [type, idStr] = editingId.split('-');
    const id = Number(idStr);

    if (type === 'type') {
      setTypeMapping(prev => ({ ...prev, [id]: editingValue }));
    } else {
      setStatusMapping(prev => ({ ...prev, [id]: editingValue }));
    }
    handleCancelEditing();
  };

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Card className="bg-card/50">
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
                <Settings className="h-8 w-8 text-primary" />
                <div>
                <CardTitle className="text-2xl">System-Administration</CardTitle>
                <CardDescription>
                    Übersicht der systemweiten ID-Konfigurationen. Änderungen werden im Browser gespeichert.
                </CardDescription>
                </div>
            </div>
             <Button onClick={saveConfig}><Save className="mr-2 h-4 w-4" />Änderungen Speichern</Button>
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6 pt-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Einheitentyp-IDs</h3>
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">ID</TableHead>
                            <TableHead>Typ-Bezeichnung</TableHead>
                            <TableHead className="w-[100px] text-right">Aktion</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Object.entries(typeMapping).map(([id, name]) => (
                            <TableRow key={`type-${id}`}>
                                <TableCell className="font-mono">{id}</TableCell>
                                <TableCell>
                                  {editingId === `type-${id}` ? (
                                    <Input value={editingValue} onChange={(e) => setEditingValue(e.target.value)} className="h-8" />
                                  ) : (
                                    name
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                   {editingId === `type-${id}` ? (
                                    <>
                                        <Button size="icon" variant="ghost" className='h-8 w-8' onClick={handleSaveEditing}><Save className="h-4 w-4" /></Button>
                                        <Button size="icon" variant="ghost" className='h-8 w-8' onClick={handleCancelEditing}><X className="h-4 w-4" /></Button>
                                    </>
                                   ) : (
                                    <Button size="icon" variant="ghost" className='h-8 w-8' onClick={() => handleStartEditing('type', id)}><Edit className="h-4 w-4" /></Button>
                                   )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
          </div>

           <div>
            <h3 className="text-lg font-semibold mb-2">Status-IDs</h3>
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">ID</TableHead>
                            <TableHead>Status-Bezeichnung</TableHead>
                             <TableHead className="w-[100px] text-right">Aktion</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {Object.entries(statusMapping).map(([id, name]) => (
                            <TableRow key={`status-${id}`}>
                                <TableCell className="font-mono">{id}</TableCell>
                                <TableCell>
                                  {editingId === `status-${id}` ? (
                                    <Input value={editingValue} onChange={(e) => setEditingValue(e.target.value)} className="h-8" />
                                  ) : (
                                    name
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                   {editingId === `status-${id}` ? (
                                    <>
                                        <Button size="icon" variant="ghost" className='h-8 w-8' onClick={handleSaveEditing}><Save className="h-4 w-4" /></Button>
                                        <Button size="icon" variant="ghost" className='h-8 w-8' onClick={handleCancelEditing}><X className="h-4 w-4" /></Button>
                                    </>
                                   ) : (
                                    <Button size="icon" variant="ghost" className='h-8 w-8' onClick={() => handleStartEditing('status', id)}><Edit className="h-4 w-4" /></Button>
                                   )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
