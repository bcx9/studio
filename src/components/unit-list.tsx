'use client';
import * as React from 'react';
import type { MeshUnit } from '@/types/mesh';
import UnitCard from '@/components/unit-card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AnimatePresence, motion } from 'framer-motion';

interface UnitListProps {
  units: MeshUnit[];
  onConfigureUnit: (unit: MeshUnit) => void;
  onDeleteUnit: (id: number) => void;
  onUnitHover: (id: number | null) => void;
  selectedUnitId?: number | null;
}

export default function UnitList({ units, onConfigureUnit, onDeleteUnit, onUnitHover, selectedUnitId }: UnitListProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');

  const filteredUnits = units
    .filter(unit => unit.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(unit => statusFilter === 'all' || unit.status.toLowerCase() === statusFilter);

  return (
    <div className="flex flex-col h-full px-2">
      <div className="flex flex-col gap-2 p-2">
        <Input
          placeholder="Filter units..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="moving">Moving</SelectItem>
            <SelectItem value="idle">Idle</SelectItem>
            <SelectItem value="alarm">Alarm</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-2">
          <AnimatePresence>
            {filteredUnits.map(unit => (
              <motion.div
                key={unit.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                onMouseEnter={() => onUnitHover(unit.id)}
                onMouseLeave={() => onUnitHover(null)}
              >
                <UnitCard 
                  unit={unit} 
                  onConfigure={onConfigureUnit} 
                  onDelete={onDeleteUnit}
                  isSelected={unit.id === selectedUnitId}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
