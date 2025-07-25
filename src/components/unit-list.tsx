
'use client';
import * as React from 'react';
import type { MeshUnit, Group, StatusMapping } from '@/types/mesh';
import UnitCard from '@/components/unit-card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AnimatePresence, motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface UnitListProps {
  units: MeshUnit[];
  groups: Group[];
  onDeleteUnit: (id: number) => void;
  onChargeUnit: (id: number) => void;
  onUnitHover: (id: number | null) => void;
  selectedUnitId?: number | null;
  onSelectUnit: (unit: MeshUnit | null) => void;
  controlCenterPosition: { lat: number; lng: number } | null;
  statusMapping: StatusMapping;
}

export default function UnitList({ 
  units, 
  groups, 
  onDeleteUnit, 
  onChargeUnit, 
  onUnitHover, 
  selectedUnitId, 
  onSelectUnit, 
  controlCenterPosition,
  statusMapping,
}: UnitListProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');

  const filteredUnits = units
    .filter(unit => unit.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(unit => statusFilter === 'all' || unit.status.toLowerCase() === statusFilter);

  const { grouped: unitsByGroup, ungrouped } = React.useMemo(() => {
    const grouped: Record<string, MeshUnit[]> = {};
    const ungrouped: MeshUnit[] = [];

    for (const unit of filteredUnits) {
      if (unit.groupId && groups.some(g => g.id === unit.groupId)) {
        if (!grouped[unit.groupId]) {
          grouped[unit.groupId] = [];
        }
        grouped[unit.groupId].push(unit);
      } else {
        ungrouped.push(unit);
      }
    }
    return { grouped, ungrouped };
  }, [filteredUnits, groups]);

  const defaultAccordionItems = React.useMemo(() => groups.map(g => g.id.toString()), [groups]);
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-3 p-3">
        <Input
          placeholder="Einheiten filtern..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Nach Status filtern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            {Object.values(statusMapping).map(statusName => (
              <SelectItem key={statusName} value={statusName.toLowerCase()}>{statusName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <ScrollArea className="flex-1">
        <Accordion type="multiple" defaultValue={defaultAccordionItems} className="w-full px-3">
            {groups.map(group => {
                const unitsInGroup = unitsByGroup[group.id] || [];
                return (
                    <AccordionItem value={group.id.toString()} key={group.id} className="border-b-white/10">
                        <AccordionTrigger className="py-3 text-sm font-semibold hover:no-underline">{group.name} ({unitsInGroup.length})</AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-2 pb-2">
                                <AnimatePresence>
                                    {unitsInGroup.length > 0 ? (
                                        unitsInGroup.map(unit => (
                                         <motion.div
                                            key={unit.id}
                                            layout
                                            initial={{ opacity: 0, y: -20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -50 }}
                                            transition={{ duration: 0.2 }}
                                            onMouseEnter={() => onUnitHover(unit.id)}
                                            onMouseLeave={() => onUnitHover(null)}
                                        >
                                            <UnitCard 
                                                unit={unit} 
                                                onDelete={onDeleteUnit}
                                                onCharge={onChargeUnit}
                                                onSelect={onSelectUnit}
                                                isSelected={unit.id === selectedUnitId}
                                                controlCenterPosition={controlCenterPosition}
                                            />
                                        </motion.div>
                                    ))
                                    ) : (
                                        <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                                            Keine Einheiten in dieser Gruppe.
                                        </p>
                                    )}
                                </AnimatePresence>
                             </div>
                        </AccordionContent>
                    </AccordionItem>
                 )
            })}
        </Accordion>
         <div className="space-y-2 p-3">
            {ungrouped.length > 0 && groups.length > 0 && <h4 className="text-sm font-semibold text-muted-foreground px-2 pt-2">Ungruppiert</h4>}
            <AnimatePresence>
                {ungrouped.map(unit => (
                <motion.div
                    key={unit.id}
                    layout
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.2 }}
                    onMouseEnter={() => onUnitHover(unit.id)}
                    onMouseLeave={() => onUnitHover(null)}
                >
                    <UnitCard 
                        unit={unit} 
                        onDelete={onDeleteUnit}
                        onCharge={onChargeUnit}
                        onSelect={onSelectUnit}
                        isSelected={unit.id === selectedUnitId}
                        controlCenterPosition={controlCenterPosition}
                    />
                </motion.div>
                ))}
            </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
