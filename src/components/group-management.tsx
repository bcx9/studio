
'use client';

import * as React from 'react';
import type { Group } from '@/types/mesh';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Users, PlusCircle, Save, Trash2, Edit, X, Move } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';


interface GroupManagementProps {
  groups: Group[];
  onAddGroup: (name: string) => void;
  onUpdateGroup: (group: Group) => void;
  onRemoveGroup: (groupId: number) => void;
  onRepositionAllUnits: (radius: number) => void;
  isRepositionPossible: boolean;
}

export default function GroupManagement({ groups, onAddGroup, onUpdateGroup, onRemoveGroup, onRepositionAllUnits, isRepositionPossible }: GroupManagementProps) {
    const [newGroupName, setNewGroupName] = React.useState('');
    const [editingGroup, setEditingGroup] = React.useState<Group | null>(null);
    const [editingName, setEditingName] = React.useState('');
    const [repositionRadius, setRepositionRadius] = React.useState(20);
    const { toast } = useToast();

    const handleAddGroup = () => {
        if (newGroupName.trim()) {
            onAddGroup(newGroupName.trim());
            setNewGroupName('');
            toast({ title: "Gruppe erstellt", description: `Die Gruppe "${newGroupName.trim()}" wurde hinzugefügt.`});
        }
    };
    
    const handleStartEditing = (group: Group) => {
        setEditingGroup(group);
        setEditingName(group.name);
    };

    const handleCancelEditing = () => {
        setEditingGroup(null);
        setEditingName('');
    };

    const handleSaveEditing = () => {
        if (editingGroup && editingName.trim()) {
            onUpdateGroup({ ...editingGroup, name: editingName.trim() });
            toast({ title: "Gruppe umbenannt", description: `Die Gruppe wurde in "${editingName.trim()}" umbenannt.` });
            handleCancelEditing();
        }
    };

    const handleRepositionClick = () => {
        onRepositionAllUnits(repositionRadius);
    }

    return (
        <div className="container mx-auto max-w-4xl py-8">
            <Card className="bg-card/50">
                <CardHeader>
                    <div className='flex items-center gap-3'>
                        <Users className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle className="text-2xl">Gruppenverwaltung</CardTitle>
                            <CardDescription>
                                Erstellen, bearbeiten und löschen Sie Einheiten-Gruppen für eine bessere Organisation und gezielte Kommunikation.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex gap-2">
                        <Input 
                            placeholder="Neuer Gruppenname..."
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddGroup()}
                        />
                        <Button onClick={handleAddGroup}>
                            <PlusCircle className="mr-2" />
                            Gruppe erstellen
                        </Button>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Gruppenname</TableHead>
                                    <TableHead className="w-[180px] text-right">Aktionen</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {groups.map(group => (
                                    <TableRow key={group.id}>
                                        <TableCell>
                                            {editingGroup?.id === group.id ? (
                                                <Input 
                                                    value={editingName}
                                                    onChange={(e) => setEditingName(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEditing()}
                                                    className="h-9"
                                                />
                                            ) : (
                                                group.name
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {editingGroup?.id === group.id ? (
                                                <>
                                                    <Button size="icon" variant="ghost" className='h-8 w-8' onClick={handleSaveEditing}><Save className="h-4 w-4" /></Button>
                                                    <Button size="icon" variant="ghost" className='h-8 w-8' onClick={handleCancelEditing}><X className="h-4 w-4" /></Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Button size="icon" variant="ghost" className='h-8 w-8' onClick={() => handleStartEditing(group)}><Edit className="h-4 w-4" /></Button>
                                                     <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button size="icon" variant="ghost" className='h-8 w-8 text-destructive/70 hover:text-destructive'><Trash2 className="h-4 w-4" /></Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Möchten Sie die Gruppe "{group.name}" wirklich löschen? Zugeordnete Einheiten werden ungruppiert. Diese Aktion kann nicht rückgängig gemacht werden.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => onRemoveGroup(group.id)} className='bg-destructive hover:bg-destructive/90'>Löschen</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {groups.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                                            Keine Gruppen vorhanden. Erstellen Sie Ihre erste Gruppe.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                     <div className="border-t pt-6">
                         <h3 className="text-lg font-semibold mb-3">Szenario-Steuerung</h3>
                         <div className="flex items-start gap-4 p-4 border rounded-lg bg-background">
                            <Move className="h-8 w-8 text-primary mt-1 shrink-0" />
                            <div>
                                <h4 className="font-semibold">Einheiten neu positionieren</h4>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Positioniert alle Einheiten zufällig in einem definierten Radius um die Leitstelle. Nützlich, um neue Szenarien zu testen.
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button onClick={handleRepositionClick} disabled={!isRepositionPossible}>
                                        <Move className="mr-2" />
                                        Alle Einheiten neu positionieren
                                    </Button>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="radius"
                                            type="number"
                                            value={repositionRadius}
                                            onChange={(e) => setRepositionRadius(Math.max(1, Number(e.target.value)))}
                                            className="w-24"
                                            disabled={!isRepositionPossible}
                                        />
                                        <Label htmlFor="radius" className="text-sm text-muted-foreground">km Radius</Label>
                                    </div>
                                </div>
                                {!isRepositionPossible && (
                                    <p className="text-xs text-yellow-500 mt-2">
                                        Setzen Sie zuerst einen Leitstellen-Marker auf der Karte, um diese Funktion zu nutzen.
                                    </p>
                                )}
                            </div>
                         </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
