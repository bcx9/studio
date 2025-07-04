
'use client';

import * as React from 'react';
import type { Group } from '@/types/mesh';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Users, PlusCircle, Save, Trash2, Edit, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


interface GroupManagementProps {
  groups: Group[];
  onAddGroup: (name: string) => void;
  onUpdateGroup: (group: Group) => void;
  onRemoveGroup: (groupId: number) => void;
}

export default function GroupManagement({ groups, onAddGroup, onUpdateGroup, onRemoveGroup }: GroupManagementProps) {
    const [newGroupName, setNewGroupName] = React.useState('');
    const [editingGroup, setEditingGroup] = React.useState<Group | null>(null);
    const [editingName, setEditingName] = React.useState('');
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
                </CardContent>
            </Card>
        </div>
    );
}
