
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lightbulb, Zap, AlertTriangle } from 'lucide-react';
import { getNetworkAnalysis } from '@/app/actions';
import { Skeleton } from '@/components/ui/skeleton';


export default function AiAnomalyDetector() {
  const [analysis, setAnalysis] = React.useState<{ summary: string; details: string } | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setAnalysis(null);
    try {
      const result = await getNetworkAnalysis();
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
    <div className="container mx-auto max-w-4xl py-2 md:py-8">
      <Card>
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
            <Button onClick={handleAnalyze} disabled={isLoading}>
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
