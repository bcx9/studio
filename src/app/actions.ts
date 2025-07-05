
'use server';

import { z } from 'zod';
import type { ConnectionSettings } from '@/types/gateway';
import { analyzeNetwork } from '@/ai/flows/network-analysis-flow';
import { aiAssistantFlow, type AiAssistantAction } from '@/ai/flows/ai-assistant-flow';
import type { Group } from '@/types/mesh';

const compactUnitSchema = z.object({
  id: z.number(),
  type: z.number(),
  status: z.number(),
  position: z.object({ lat: z.number(), lng: z.number() }),
  speed: z.number(),
  heading: z.number(),
  battery: z.number(),
  timestamp: z.number(),
  sendInterval: z.number(),
  isActive: z.boolean(),
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

export async function invokeAiAssistant(
    query: string,
    units: z.infer<typeof compactUnitSchema>[],
    groups: Group[],
    unitNames: Record<number, string>
): Promise<{ responseText: string; actions: AiAssistantAction[] }> {
    try {
        const result = await aiAssistantFlow({ query, units, groups, unitNames });
        return result || { responseText: "Ich konnte Ihre Anfrage nicht bearbeiten.", actions: [] };
    } catch (error) {
        console.error('AI Assistant flow failed:', error);
        return {
            responseText: "Ein interner Fehler ist aufgetreten. Bitte überprüfen Sie die Server-Logs.",
            actions: [],
        };
    }
}


export async function connectToGateway(
    settings: ConnectionSettings
): Promise<{ success: boolean; message: string }> {
    console.log('Verbindungsversuch mit Einstellungen:', settings);

    await new Promise(resolve => setTimeout(resolve, 2000)); 

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

    return {
        success: true,
        message: 'Verbindung zum Gateway erfolgreich hergestellt. Warte auf Daten... (Simuliert)',
    };
}
