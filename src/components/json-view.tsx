'use client';
import type { MeshUnit } from '@/types/mesh';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Code2 } from 'lucide-react';

interface JsonViewProps {
  unit: MeshUnit;
}

export default function JsonView({ unit }: JsonViewProps) {
  return (
    <div className="container mx-auto max-w-4xl py-8">
       <Card className="bg-card/50">
        <CardHeader>
          <div className='flex items-center gap-3'>
            <Code2 className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl">Rohdaten für {unit.name}</CardTitle>
              <CardDescription>
                Live JSON-Nachricht, die von der Einheit übertragen wird.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            <pre className="mt-4 p-4 rounded-lg bg-black/80 text-green-400 overflow-x-auto text-sm font-mono">
                <code>{JSON.stringify(unit, null, 2)}</code>
            </pre>
        </CardContent>
      </Card>
    </div>
  );
}
