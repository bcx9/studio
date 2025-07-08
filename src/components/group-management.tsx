
'use client';

import * as React from 'react';
import type { Group, Assignment } from '@/types/mesh';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Users, PlusCircle, Save, Trash2, Edit, X, Move, MapPin, Route, Ban } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';


interface GroupManagementProps {
  groups: Group[];
  assignments: Assignment[];
  onAddGroup: (name: string) => void;
  onUpdateGroup: (group: Group) => void;
  onRemoveGroup: (groupId: number) => void;
  onRepositionAllUnits: (radius: number) => void;
  onStartAssignment: (type: 'patrol' | 'pendulum', groupId: number, groupName: string) => void;
  onRemoveAssignment: (groupId: number) => void;
  isRepositionPossible: boolean;
}

export default function GroupManagement({ 
    groups, 
    assignments,
    onAddGroup, 
    onUpdateGroup, 
    onRemoveGroup, 
    onRepositionAllUnits, 
    onStartAssignment,
    onRemoveAssignment,
    isRepositionPossible 
}: GroupManagementProps) {
    const [newGroupName, setNewGroupName] = React.useState('');
    const [editingGroup, setEditingGroup] = React.useState<Group | null>(null);
    const [editingName, setEditingName] = React.useState('');
    const [assignmentRadius, setAssignmentRadius] = React.useState(1.5);
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
        onRepositionAllUnits(20); // Hardcoded radius for now
    }
    
    const handleStartPatrol = (groupId: number, groupName: string) => {
        onStartAssignment('patrol', groupId, groupName);
    };
    
    const handleStartPendulum = (groupId: number, groupName: string) => {
        onStartAssignment('pendulum', groupId, groupName);
    };

    return (
        <div className="flex flex-col gap-8">
            <Card>
                <CardHeader>
                    <div className='flex items-center gap-3'>
                        <Users className="h-6 w-6 text-primary" />
                        <div>
                            <CardTitle className="text-xl">Gruppenverwaltung & Befehle</CardTitle>
                            <CardDescription>
                                Erstellen, bearbeiten und kommandieren Sie Einheiten-Gruppen.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input 
                            placeholder="Neuer Gruppenname..."
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddGroup()}
                        />
                        <Button onClick={handleAddGroup}>
                            <PlusCircle className="mr-2" />
                            Erstellen
                        </Button>
                    </div>

                    <div className="border-none rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b-0">
                                    <TableHead>Gruppenname</TableHead>
                                    <TableHead className="w-[180px] text-right">Aktionen</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {groups.map(group => {
                                    const assignment = assignments.find(p => p.groupId === group.id);
                                    return (
                                    <TableRow key={group.id} className="border-b-0">
                                        <TableCell>
                                            {editingGroup?.id === group.id ? (
                                                <Input 
                                                    value={editingName}
                                                    onChange={(e) => setEditingName(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEditing()}
                                                    className="h-9"
                                                />
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span>{group.name}</span>
                                                    {assignment?.type === 'patrol' && <MapPin className="h-4 w-4 text-accent" />}
                                                    {assignment?.type === 'pendulum' && <Route className="h-4 w-4 text-accent" />}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right flex items-center justify-end gap-1">
                                            {editingGroup?.id === group.id ? (
                                                <>
                                                    <Button size="icon" variant="ghost" className='h-8 w-8 rounded-full' onClick={handleSaveEditing}><Save className="h-4 w-4" /></Button>
                                                    <Button size="icon" variant="ghost" className='h-8 w-8 rounded-full' onClick={handleCancelEditing}><X className="h-4 w-4" /></Button>
                                                </>
                                            ) : (
                                                <>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button size="sm" variant="outline">Befehl</Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            <DropdownMenuItem onSelect={() => handleStartPatrol(group.id, group.name)}>
                                                                <MapPin className="mr-2 h-4 w-4"/> Patrouille zuweisen
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onSelect={() => handleStartPendulum(group.id, group.name)}>
                                                                <Route className="mr-2 h-4 w-4"/> Pendelroute zuweisen
                                                            </DropdownMenuItem>
                                                             {assignment && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem onSelect={() => onRemoveAssignment(group.id)} className="text-destructive">
                                                                        <Ban className="mr-2 h-4 w-4"/> Befehl aufheben
                                                                    </DropdownMenuItem>
                                                                </>
                                                             )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>

                                                    <TooltipProvider delayDuration={200}>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button size="icon" variant="ghost" className='h-8 w-8 rounded-full' onClick={() => handleStartEditing(group)}><Edit className="h-4 w-4" /></Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>Gruppe umbenennen</p></TooltipContent>
                                                        </Tooltip>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button size="icon" variant="ghost" className='h-8 w-8 rounded-full text-destructive/70 hover:text-destructive'><Trash2 className="h-4 w-4" /></Button>
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
                                                    </TooltipProvider>
                                                </>
                                            )}
                                            
                                        </TableCell>
                                    </TableRow>
                                    )
                                })}
                                {groups.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                                            Keine Gruppen vorhanden.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <div className='flex items-center gap-3'>
                        <Move className="h-6 w-6 text-primary" />
                        <div>
                            <CardTitle className="text-xl">Szenario-Steuerung</CardTitle>
                            <CardDescription>
                                Konfigurieren Sie Parameter für Befehle und Szenarien.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                 <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="radius" className="text-sm font-medium">Patrouillenradius</Label>
                        <div className="flex items-center gap-2 mt-1">
                            <Input
                                id="radius"
                                type="number"
                                value={assignmentRadius}
                                onChange={(e) => setAssignmentRadius(Math.max(0.1, Number(e.target.value)))}
                                className="w-24 h-9"
                            />
                            <span className="text-sm text-muted-foreground">km</span>
                        </div>
                         <p className="text-xs text-muted-foreground mt-1">
                            Radius für den nächsten "Patrouille zuweisen" Befehl.
                        </p>
                    </div>
                     <div className="border-t pt-4">
                        <p className="text-sm text-muted-foreground mb-2">
                            Positioniert alle Einheiten zufällig in einem 20km-Radius um die Leitstelle.
                        </p>
                        <Button onClick={handleRepositionClick} disabled={!isRepositionPossible}>
                                <Move className="mr-2" />
                                Alle Einheiten neu positionieren
                        </Button>
                        {!isRepositionPossible && (
                            <p className="text-xs text-yellow-500 mt-2">
                                Setzen Sie zuerst einen Leitstellen-Marker auf der Karte, um diese Funktion zu nutzen.
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
