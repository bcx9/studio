
'use client';
import type { MeshUnit, StatusMapping, TypeMapping } from '@/types/mesh';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Code2 } from 'lucide-react';
import { createReverseMapping } from '@/lib/utils';

interface JsonViewProps {
  unit: MeshUnit;
  typeMapping: TypeMapping;
  statusMapping: StatusMapping;
}

export default function JsonView({ unit, typeMapping, statusMapping }: JsonViewProps) {
  const UNIT_TYPE_TO_CODE = createReverseMapping(typeMapping);
  const UNIT_STATUS_TO_CODE = createReverseMapping(statusMapping);

  // Create the compact version of the unit data for demonstration
  const compactUnit = {
    i: unit.id,
    t: Number(UNIT_TYPE_TO_CODE[unit.type]),
    s: Number(UNIT_STATUS_TO_CODE[unit.status]),
    p: {
        a: parseFloat(unit.position.lat.toFixed(5)),
        o: parseFloat(unit.position.lng.toFixed(5)),
    },
    v: unit.speed,
    h: unit.heading,
    b: parseFloat(unit.battery.toFixed(1)),
    ts: unit.timestamp,
    si: unit.sendInterval,
    a: unit.isActive ? 1 : 0,
    ss: unit.signalStrength,
    hc: unit.hopCount,
  };
  
  // The full data, as the control center sees it (including the name)
  const hydratedUnit = unit;

  return (
    <div className="container mx-auto max-w-4xl py-2 md:py-8">
       <Card>
        <CardHeader>
          <div className='flex items-center gap-3'>
            <Code2 className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl">Datenansicht für {unit.name}</CardTitle>
              <CardDescription>
                Vergleich der Netzwerk-Nachricht mit den angereicherten Daten in der Leitstelle.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            <div className="grid md:grid-cols-2 gap-6 mt-4">
                <div>
                    <h3 className="font-semibold mb-2 text-lg">Netzwerknachricht (Kompakt)</h3>
                    <p className="text-sm text-muted-foreground mb-3">Dies ist die tatsächliche Nachricht, die von der Node gesendet wird, um Datenverkehr zu sparen.</p>
                    <pre className="p-4 rounded-lg bg-muted text-orange-400 overflow-x-auto text-sm font-mono h-full">
                        <code>{JSON.stringify(compactUnit, null, 2)}</code>
                    </pre>
                </div>
                 <div>
                    <h3 className="font-semibold mb-2 text-lg">Leitstellenansicht (Angereichert)</h3>
                    <p className="text-sm text-muted-foreground mb-3">Nach dem Empfang reichert die Leitstelle die Daten mit bekannten Informationen (Name, etc.) an.</p>
                    <pre className="p-4 rounded-lg bg-muted text-green-400 overflow-x-auto text-sm font-mono h-full">
                        <code>{JSON.stringify(hydratedUnit, null, 2)}</code>
                    </pre>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
