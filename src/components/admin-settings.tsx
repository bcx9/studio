
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Settings, Save, X, Edit, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { TypeMapping, StatusMapping } from '@/types/mesh';
import { loadAdminSettings, saveAdminSettings } from '@/app/actions';
import { Skeleton } from './ui/skeleton';

export default function AdminSettings() {
  const [typeMapping, setTypeMapping] = React.useState<TypeMapping | null>(null);
  const [statusMapping, setStatusMapping] = React.useState<StatusMapping | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingValue, setEditingValue] = React.useState('');
  const { toast } = useToast();

  React.useEffect(() => {
    const fetchSettings = async () => {
        try {
            setIsLoading(true);
            const settings = await loadAdminSettings();
            setTypeMapping(settings.typeMapping);
            setStatusMapping(settings.statusMapping);
        } catch (error) {
            console.error("Failed to load admin settings", error);
            toast({ variant: 'destructive', title: 'Fehler beim Laden', description: 'Die Konfiguration konnte nicht vom Server geladen werden.' });
        } finally {
            setIsLoading(false);
        }
    }
    fetchSettings();
  }, [toast]);

  const handleSave = async () => {
    if (!typeMapping || !statusMapping) return;
    try {
        setIsSaving(true);
        await saveAdminSettings({ typeMapping, statusMapping });
        toast({ title: 'Konfiguration gespeichert', description: 'Die System-Mappings wurden erfolgreich aktualisiert.' });
    } catch (error) {
        console.error("Failed to save config", error);
        toast({ variant: 'destructive', title: 'Fehler beim Speichern', description: 'Die Konfiguration konnte nicht gespeichert werden.' });
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleStartEditing = (type: 'type' | 'status', id: string) => {
    if (!typeMapping || !statusMapping) return;
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
      setTypeMapping(prev => prev ? ({ ...prev, [id]: editingValue }) : null);
    } else {
      setStatusMapping(prev => prev ? ({ ...prev, [id]: editingValue }) : null);
    }
    handleCancelEditing();
  };
  
  const renderTableSkeleton = () => (
    <div className='space-y-2'>
        <Skeleton className='h-8 w-1/3' />
        <div className='border rounded-lg p-2'>
            <Skeleton className='h-10 w-full mb-2' />
            <Skeleton className='h-8 w-full mb-1' />
            <Skeleton className='h-8 w-full' />
        </div>
    </div>
  );

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
                    Übersicht der systemweiten ID-Konfigurationen. Änderungen werden serverseitig gespeichert.
                </CardDescription>
                </div>
            </div>
             <Button onClick={handleSave} disabled={isSaving || isLoading}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Änderungen Speichern
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6 pt-6">
          {isLoading ? (
            <>
              {renderTableSkeleton()}
              {renderTableSkeleton()}
            </>
          ) : (
            <>
            {typeMapping && (
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
            )}

            {statusMapping && (
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
            )}
          </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
