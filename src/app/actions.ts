'use server';

import { z } from 'zod';
import { CODE_TO_UNIT_STATUS, CODE_TO_UNIT_TYPE } from '@/types/mesh';
import type { ConnectionSettings } from '@/types/gateway';

// Represents the data format for network analysis, which is compact.
// Name is not included, as it's managed by the control center (Leitstelle) and linked via ID.
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
  const validation = analyzeNetworkSchema.safeParse(compactUnitsData);
  if (!validation.success) {
    throw new Error('Ungültige Einheitsdaten bereitgestellt.');
  }
  const compactUnits = validation.data;

  // --- Hydration Step ---
  // The server receives compact data and "hydrates" it with centrally stored information (names).
  const hydratedUnits = compactUnits.map(unit => ({
    ...unit,
    // The name is now retrieved from the provided map, which simulates the central registry.
    name: unitNames[unit.id] || `Unbekannte Einheit #${unit.id}`,
    type: CODE_TO_UNIT_TYPE[unit.type] || 'Vehicle',
    status: CODE_TO_UNIT_STATUS[unit.status] || 'Offline',
  }));

  // In a real scenario, this would be:
  // const analysis = await analyzeNetworkFlow.run({ units });
  // return analysis;

  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Simulated AI logic
  const anomalies = [];
  const now = Date.now();

  for (const unit of hydratedUnits) {
    if (unit.status === 'Offline' && unit.isActive) {
      anomalies.push(
        `Einheit ${unit.name} (${unit.id}) ist unerwartet offline. Dies könnte auf einen kritischen Fehler oder Signalverlust hindeuten.`
      );
    }
    if (unit.battery < 20 && unit.isActive) {
      anomalies.push(
        `Einheit ${unit.name} (${unit.id}) hat einen niedrigen Akkustand (${unit.battery}%). Sofortiges Aufladen oder Austauschen wird empfohlen.`
      );
    }
    if ((now - unit.timestamp) > (unit.sendInterval * 1000 * 5) && unit.isActive) {
       anomalies.push(
        `Einheit ${unit.name} (${unit.id}) hat sich seit über 5 Sendeintervallen nicht gemeldet. Zuletzt gesehen um ${new Date(unit.timestamp).toLocaleTimeString()}. Mögliche Fehlfunktion.`
      );
    }
  }

  if (anomalies.length > 0) {
    return {
      summary: `Anomalie entdeckt! ${anomalies.length} Problem(e) erfordern Aufmerksamkeit.`,
      details: anomalies.join('\n\n'),
    };
  }

  return {
    summary: 'Netzwerkstatus: Optimal',
    details: 'Alle Einheiten arbeiten innerhalb der normalen Parameter. Keine ungewöhnlichen Aktivitäten festgestellt.',
  };
}


export async function connectToGateway(
    settings: ConnectionSettings
): Promise<{ success: boolean; message: string }> {
    console.log('Verbindungsversuch mit Einstellungen:', settings);

    // WICHTIGER HINWEIS:
    // Dies ist eine SIMULATION. In einer echten Next.js-Umgebung (besonders bei Serverless-Deployment)
    // kann man keine persistenten Verbindungen wie zu einem seriellen Port aufbauen.
    // Dafür wäre ein separater, langlaufender "Bridge"-Service (z.B. in Node.js oder Python) nötig,
    // der die Daten vom Meshtastic-Gerät empfängt und an einen API-Endpunkt dieser Web-App sendet.

    await new Promise(resolve => setTimeout(resolve, 2000)); // Simuliere Verbindungsaufbau

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
