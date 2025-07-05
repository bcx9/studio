
'use server';

import { z } from 'zod';
import type { ConnectionSettings } from '@/types/gateway';
import { analyzeNetwork } from '@/ai/flows/network-analysis-flow';
import type { Group } from '@/types/mesh';
import { aiAssistantFlow } from '@/ai/flows/ai-assistant-flow';
import type { AiAssistantAction, AiAssistantOutput } from '@/ai/flows/ai-assistant-flow';

const compactUnitSchema = z.object({
  i: z.number(),
  t: z.number(),
  s: z.number(),
  p: z.object({ a: z.number(), o: z.number() }),
  v: z.number(),
  h: z.number(),
  b: z.number(),
  ts: z.number(),
  si: z.number(),
  a: z.union([z.literal(1), z.literal(0)]),
  ss: z.number(),
  hc: z.number(),
});

const analyzeNetworkSchema = z.array(compactUnitSchema);

export async function getNetworkAnalysis(
  compactUnitsData: z.infer<typeof analyzeNetworkSchema>,
  unitNames: Record<number, string>
): Promise<{ summary: string; details: string }> {
  try {
    const analysis = await analyzeNetwork({ units: compactUnitsData, unitNames });
    return analysis;
  } catch (error) {
    console.error('Genkit flow failed:', error);
    return {
      summary: 'Analyse Fehlgeschlagen',
      details: 'Die KI-Analyse konnte nicht durchgeführt werden. Überprüfen Sie die Server-Logs.',
    };
  }
}

const assistantCompactUnitSchema = z.object({
  i: z.number(),
  t: z.number(),
  s: z.number(),
  p: z.object({ a: z.number(), o: z.number() }),
  v: z.number(),
  h: z.number(),
  b: z.number(),
  ts: z.number(),
  si: z.number(),
  a: z.union([z.literal(1), z.literal(0)]),
});

export async function invokeAiAssistant(
  query: string,
  compactUnits: z.infer<typeof assistantCompactUnitSchema>[],
  groups: Group[],
  unitNames: Record<number, string>
): Promise<AiAssistantOutput> {
  try {
    const result = await aiAssistantFlow({
      query,
      units: compactUnits,
      groups,
      unitNames,
    });
    return result;
  } catch (error) {
    console.error('AI Assistant flow failed:', error);
    return {
      responseText: "Entschuldigung, bei der Verarbeitung Ihrer Anfrage ist ein Fehler aufgetreten.",
      actions: [],
    };
  }
}


export async function connectToGateway(
    settings: ConnectionSettings
): Promise<{ success: boolean; message: string }> {
    console.log('Verbindungsversuch mit Einstellungen:', settings);

    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 2000)); 

    // Simulate connection errors for specific inputs
    if (settings.type === 'serial' && settings.serialPort?.toLowerCase().includes('error')) {
         return {
            success: false,
            message: `Fehler: Serieller Port ${settings.serialPort} konnte nicht geöffnet werden. (Simuliert)`,
        };
    }
    
    if (settings.type === 'network' && settings.ipAddress?.includes('0.0.0.0')) {
        return {
            success: false,
            message: `Fehler: Verbindung zu ${settings.ipAddress}:${settings.port} fehlgeschlagen. (Simuliert)`,
        };
    }

    // Simulate successful connection
    return {
        success: true,
        message: 'Verbindung zum Gateway erfolgreich hergestellt. Warte auf Daten... (Simuliert)',
    };
}
