'use server';

import { z } from 'zod';
import { CODE_TO_UNIT_STATUS, CODE_TO_UNIT_TYPE } from '@/types/mesh';

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
  compactUnitsData: z.infer<typeof analyzeNetworkSchema>
): Promise<{ summary: string; details: string }> {
  const validation = analyzeNetworkSchema.safeParse(compactUnitsData);
  if (!validation.success) {
    throw new Error('Ungültige Einheitsdaten bereitgestellt.');
  }
  const compactUnits = validation.data;

  // --- Hydration Step ---
  // The server receives compact data and "hydrates" it for its internal logic.
  const hydratedUnits = compactUnits.map(unit => ({
    ...unit,
    // On the server, we use the ID to look up the name. For this simulation, we'll just use the ID as a placeholder.
    // The key point is that the name is not transmitted over the "network".
    name: `Einheit #${unit.id}`,
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
