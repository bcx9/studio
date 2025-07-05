
'use client';

import * as React from 'react';
import type { MeshUnit } from '@/types/mesh';
import type { GatewayStatus } from '@/types/gateway';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lightbulb, Zap, AlertTriangle } from 'lucide-react';
import { getNetworkAnalysis } from '@/app/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { UNIT_STATUS_TO_CODE, UNIT_TYPE_TO_CODE } from '@/types/mesh';

interface AiAnomalyDetectorProps {
  units: MeshUnit[];
  gatewayStatus: GatewayStatus;
}

export default function AiAnomalyDetector({ units, gatewayStatus }: AiAnomalyDetectorProps) {
  const [analysis, setAnalysis] = React.useState<{ summary: string; details: string } | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const isDisconnected = gatewayStatus !== 'connected';

  const handleAnalyze = async () => {
    setIsLoading(true);
    setAnalysis(null);
    try {
      // --- Compaction Step ---
      // Transform the hydrated frontend data into a compact format for the server action.
      // This simulates sending efficient messages over a real network.
      const compactUnits = units.map(unit => ({
        id: unit.id,
        type: UNIT_TYPE_TO_CODE[unit.type],
        status: UNIT_STATUS_TO_CODE[unit.status],
        position: unit.position,
        speed: unit.speed,
        heading: unit.heading,
        battery: unit.battery,
        timestamp: unit.timestamp,
        sendInterval: unit.sendInterval,
        isActive: unit.isActive,
        signalStrength: unit.signalStrength,
        hopCount: unit.hopCount,
      }));

      // Create a map of IDs to names to simulate the central registry lookup on the server.
      const unitNames = units.reduce((acc, unit) => {
        acc[unit.id] = unit.name;
        return acc;
      }, {} as Record<number, string>);

      const result = await getNetworkAnalysis(compactUnits, unitNames);
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
                {isDisconnected && <p className="text-yellow-500 mt-2">Bitte verbinden Sie sich zuerst mit dem Gateway, um die Analyse zu starten.</p>}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-start gap-6">
            <Button onClick={handleAnalyze} disabled={isLoading || isDisconnected || units.length === 0}>
              {isLoading ? 'Netzwerk wird analysiert...' : (isDisconnected ? 'Gateway nicht verbunden' : 'Anomalieerkennung durchführen')}
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
