
'use client';

import * as React from 'react';
import type { MeshUnit, TypeMapping, StatusMapping } from '@/types/mesh';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lightbulb, Zap, AlertTriangle } from 'lucide-react';
import { getNetworkAnalysis } from '@/app/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { createReverseMapping } from '@/lib/utils';


interface AiAnomalyDetectorProps {
  units: MeshUnit[];
  typeMapping: TypeMapping;
  statusMapping: StatusMapping;
}

export default function AiAnomalyDetector({ units, typeMapping, statusMapping }: AiAnomalyDetectorProps) {
  const [analysis, setAnalysis] = React.useState<{ summary: string; details: string } | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setAnalysis(null);
    try {
      const UNIT_TYPE_TO_CODE = createReverseMapping(typeMapping);
      const UNIT_STATUS_TO_CODE = createReverseMapping(statusMapping);

      // --- Compaction Step ---
      const compactUnits = units.map(unit => ({
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
      }));

      // Create a map of IDs to names to simulate the central registry lookup on the server.
      const unitNames = units.reduce((acc, unit) => {
        acc[unit.id] = unit.name;
        return acc;
      }, {} as Record<number, string>);

      const result = await getNetworkAnalysis(compactUnits, unitNames, typeMapping, statusMapping);
      setAnalysis(result);
    } catch (error) {
      console.error('Analyse fehlgeschlagen:', error);
      setAnalysis({
        summary: 'Analyse Fehlgeschlagen',
        details: 'Die Analyse konnte nicht vom Server abgerufen werden. Bitte versuchen Sie es später erneut.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getIconForSummary = (summary: string) => {
    if (summary.includes('Optimal') || summary.includes('Normal')) {
        return <Lightbulb className="h-6 w-6 text-green-500" />;
    }
    if (summary.includes('Anomalie') || summary.includes('Aufmerksamkeit')) {
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
    }
    return <Zap className="h-6 w-6 text-primary" />;
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Card className="bg-card/50">
        <CardHeader>
          <div className='flex items-center gap-3'>
            <Zap className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl">KI-Netzwerküberwachung</CardTitle>
              <CardDescription>
                Nutzen Sie generative KI, um ungewöhnliche Datenübertragungen oder Verhaltensweisen zu identifizieren und fehlerhafte MESH-Knoten zu lokalisieren.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-start gap-6">
            <Button onClick={handleAnalyze} disabled={isLoading || units.length === 0}>
              {isLoading ? 'Netzwerk wird analysiert...' : 'Anomalieerkennung durchführen'}
            </Button>
            
            {isLoading && (
                 <Card className="w-full">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-6 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                </Card>
            )}

            {analysis && (
              <Card className="w-full animate-in fade-in-50">
                <CardHeader className='flex flex-row items-center gap-4'>
                    {getIconForSummary(analysis.summary)}
                    <h3 className="text-lg font-semibold">{analysis.summary}</h3>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-muted-foreground">{analysis.details}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
