
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Settings, Save, X, Edit, Loader2, Trash2, PlusCircle, BatteryCharging, Zap, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { TypeMapping, StatusMapping } from '@/types/mesh';
import { loadAdminSettings, saveAdminSettings, addTypeMapping, removeTypeMapping, addStatusMapping, removeStatusMapping, chargeAllUnitsOnBackend } from '@/app/actions';
import { Skeleton } from './ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from './ui/label';

export default function AdminSettings() {
  const [typeMapping, setTypeMapping] = React.useState<TypeMapping | null>(null);
  const [statusMapping, setStatusMapping] = React.useState<StatusMapping | null>(null);
  const [maxRangeKm, setMaxRangeKm] = React.useState<number | null>(null);
  
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isAdding, setIsAdding] = React.useState<'type' | 'status' | null>(null);
  const [isChargingAll, setIsChargingAll] = React.useState(false);

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingValue, setEditingValue] = React.useState('');

  const [newTypeId, setNewTypeId] = React.useState('');
  const [newTypeName, setNewTypeName] = React.useState('');
  const [newStatusId, setNewStatusId] = React.useState('');
  const [newStatusName, setNewStatusName] = React.useState('');

  const { toast } = useToast();

  const fetchSettings = React.useCallback(async () => {
    try {
        !isLoading && setIsLoading(true);
        const settings = await loadAdminSettings();
        setTypeMapping(settings.typeMapping);
        setStatusMapping(settings.statusMapping);
        setMaxRangeKm(settings.maxRangeKm);
    } catch (error) {
        console.error("Failed to load admin settings", error);
        toast({ variant: 'destructive', title: 'Fehler beim Laden', description: 'Die Konfiguration konnte nicht vom Server geladen werden.' });
    } finally {
        setIsLoading(false);
    }
  }, [toast, isLoading]);

  React.useEffect(() => {
    fetchSettings();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveEdits = async () => {
    if (!typeMapping || !statusMapping || maxRangeKm === null) return;
    try {
        setIsSaving(true);
        await saveAdminSettings({ typeMapping, statusMapping, maxRangeKm });
        toast({ title: 'Konfiguration gespeichert', description: 'Alle Änderungen wurden serverseitig gespeichert.' });
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
  
  const handleConfirmEdit = () => {
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

  const handleAdd = async (type: 'type' | 'status') => {
    setIsAdding(type);
    let result;
    if (type === 'type') {
        if (!newTypeId || !newTypeName) {
            toast({ variant: 'destructive', title: 'Validierungsfehler', description: 'ID und Bezeichnung dürfen nicht leer sein.' });
            setIsAdding(null);
            return;
        }
        result = await addTypeMapping(Number(newTypeId), newTypeName);
    } else {
        if (!newStatusId || !newStatusName) {
            toast({ variant: 'destructive', title: 'Validierungsfehler', description: 'ID und Bezeichnung dürfen nicht leer sein.' });
            setIsAdding(null);
            return;
        }
        result = await addStatusMapping(Number(newStatusId), newStatusName);
    }

    if (result.success) {
        toast({ title: 'Eintrag hinzugefügt', description: 'Die Konfiguration wurde aktualisiert.' });
        if (type === 'type') {
            setNewTypeId('');
            setNewTypeName('');
        } else {
            setNewStatusId('');
            setNewStatusName('');
        }
        await fetchSettings();
    } else {
        toast({ variant: 'destructive', title: 'Fehler beim Hinzufügen', description: result.message });
    }
    setIsAdding(null);
  };

  const handleRemove = async (type: 'type' | 'status', id: number) => {
      const result = type === 'type' ? await removeTypeMapping(id) : await removeStatusMapping(id);
      if (result.success) {
          toast({ title: 'Eintrag entfernt', description: 'Die Konfiguration wurde aktualisiert.' });
          await fetchSettings();
      } else {
          toast({ variant: 'destructive', title: 'Fehler beim Entfernen', description: result.message });
      }
  };

  const handleChargeAll = async () => {
    setIsChargingAll(true);
    try {
        await chargeAllUnitsOnBackend();
        toast({
            title: 'Aktion Erfolgreich',
            description: 'Alle Einheiten werden aufgeladen.',
        });
    } catch (error) {
        console.error("Failed to charge all units", error);
        toast({ variant: 'destructive', title: 'Fehler', description: 'Einheiten konnten nicht geladen werden.' });
    } finally {
        setIsChargingAll(false);
    }
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
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
                <Settings className="h-8 w-8 text-primary" />
                <div>
                <CardTitle className="text-2xl">System-Administration</CardTitle>
                <CardDescription>
                    Übersicht der systemweiten Konfigurationen.
                </CardDescription>
                </div>
            </div>
             <Button onClick={handleSaveEdits} disabled={isSaving || isLoading}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Änderungen Speichern
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          {isLoading ? (
            <>
              {renderTableSkeleton()}
              {renderTableSkeleton()}
            </>
          ) : (
            <>
            <div className="grid md:grid-cols-2 gap-8">
                {typeMapping && (
                <div>
                <h3 className="text-lg font-semibold mb-2">Einheitentyp-IDs</h3>
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">ID</TableHead>
                                <TableHead>Typ-Bezeichnung</TableHead>
                                <TableHead className="w-[140px] text-right">Aktion</TableHead>
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
                                    <TableCell className="text-right space-x-0.5">
                                        {editingId === `type-${id}` ? (
                                        <>
                                            <Button size="icon" variant="ghost" className='h-8 w-8' onClick={handleConfirmEdit}><Save className="h-4 w-4" /></Button>
                                            <Button size="icon" variant="ghost" className='h-8 w-8' onClick={handleCancelEditing}><X className="h-4 w-4" /></Button>
                                        </>
                                        ) : (
                                        <>
                                            <Button size="icon" variant="ghost" className='h-8 w-8' onClick={() => handleStartEditing('type', id)}><Edit className="h-4 w-4" /></Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button size="icon" variant="ghost" className='h-8 w-8 text-destructive/70 hover:text-destructive'><Trash2 className="h-4 w-4" /></Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
                                                        <AlertDialogDescription>Möchten Sie den Typ "{name}" (ID: {id}) wirklich löschen? Dies kann nicht rückgängig gemacht werden.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleRemove('type', Number(id))} className="bg-destructive hover:bg-destructive/90">Löschen</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell><Input type="number" placeholder="ID" className="h-9" value={newTypeId} onChange={e => setNewTypeId(e.target.value)} /></TableCell>
                                <TableCell><Input placeholder="Bezeichnung" className="h-9" value={newTypeName} onChange={e => setNewTypeName(e.target.value)} /></TableCell>
                                <TableCell className="text-right">
                                    <Button size="sm" onClick={() => handleAdd('type')} disabled={isAdding === 'type'}>
                                        {isAdding === 'type' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />} Hinzufügen
                                    </Button>
                                </TableCell>
                            </TableRow>
                        </TableFooter>
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
                                <TableHead className="w-[140px] text-right">Aktion</TableHead>
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
                                    <TableCell className="text-right space-x-0.5">
                                        {editingId === `status-${id}` ? (
                                        <>
                                            <Button size="icon" variant="ghost" className='h-8 w-8' onClick={handleConfirmEdit}><Save className="h-4 w-4" /></Button>
                                            <Button size="icon" variant="ghost" className='h-8 w-8' onClick={handleCancelEditing}><X className="h-4 w-4" /></Button>
                                        </>
                                        ) : (
                                        <>
                                            <Button size="icon" variant="ghost" className='h-8 w-8' onClick={() => handleStartEditing('status', id)}><Edit className="h-4 w-4" /></Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button size="icon" variant="ghost" className='h-8 w-8 text-destructive/70 hover:text-destructive'><Trash2 className="h-4 w-4" /></Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
                                                        <AlertDialogDescription>Möchten Sie den Status "{name}" (ID: {id}) wirklich löschen? Dies kann nicht rückgängig gemacht werden.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleRemove('status', Number(id))} className="bg-destructive hover:bg-destructive/90">Löschen</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell><Input type="number" placeholder="ID" className="h-9" value={newStatusId} onChange={e => setNewStatusId(e.target.value)} /></TableCell>
                                <TableCell><Input placeholder="Bezeichnung" className="h-9" value={newStatusName} onChange={e => setNewStatusName(e.target.value)} /></TableCell>
                                <TableCell className="text-right">
                                    <Button size="sm" onClick={() => handleAdd('status')} disabled={isAdding === 'status'}>
                                        {isAdding === 'status' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />} Hinzufügen
                                    </Button>
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
                </div>
                )}
            </div>
            <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Netzwerkparameter</h3>
                <div className="max-w-xs space-y-2">
                    <Label htmlFor="max-range">Maximale Reichweite (km)</Label>
                    <Input
                        id="max-range"
                        type="number"
                        value={maxRangeKm ?? ''}
                        onChange={(e) => setMaxRangeKm(Number(e.target.value))}
                        min="0.1"
                        step="0.1"
                        disabled={isLoading}
                    />
                    <p className="text-sm text-muted-foreground">
                        Die maximale Distanz, die eine Node Signale senden/empfangen kann.
                    </p>
                </div>
            </div>
          </>
          )}
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Zap className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl">Globale Aktionen</CardTitle>
              <CardDescription>
                Globale Befehle, die die gesamte Simulation beeinflussen.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button onClick={handleChargeAll} disabled={isChargingAll}>
              {isChargingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BatteryCharging className="mr-2 h-4 w-4" />}
              Alle Einheiten Aufladen
            </Button>
            <p className="text-sm text-muted-foreground">
              Setzt den Akkustand aller Einheiten auf 100% und reaktiviert sie.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
