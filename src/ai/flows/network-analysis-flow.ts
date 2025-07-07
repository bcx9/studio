
'use server';
/**
 * @fileOverview A network analysis AI agent for mesh networks.
 *
 * - analyzeNetwork - A function that handles the network diagnosis process.
 * - NetworkAnalysisInput - The input type for the analyzeNetwork function.
 * - NetworkAnalysisOutput - The return type for the analyzeNetwork function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const compactUnitSchema = z.object({
  i: z.number().describe('Unit ID'),
  t: z.number().describe('Unit Type Code'),
  s: z.number().describe('Unit Status Code'),
  p: z.object({
    a: z.number().describe('Latitude'),
    o: z.number().describe('Longitude'),
  }).describe('Position'),
  v: z.number().describe('Speed in km/h'),
  h: z.number().describe('Heading in degrees'),
  b: z.number().describe('Battery percentage'),
  ts: z.number().describe('Timestamp (epoch)'),
  si: z.number().describe('Send Interval in seconds'),
  a: z.literal(1).or(z.literal(0)).describe('Is Active (1 for true, 0 for false)'),
  ss: z.number().describe('Signal Strength (RSSI) in dBm'),
  hc: z.number().describe('Hop Count'),
});

const NetworkAnalysisInputSchema = z.object({
  units: z.array(compactUnitSchema),
  unitNames: z.record(z.string()).describe("A map of unit IDs to their names."),
  typeMapping: z.record(z.string()).describe("A map of unit type codes to their string representation."),
  statusMapping: z.record(z.string()).describe("A map of unit status codes to their string representation."),
});
export type NetworkAnalysisInput = z.infer<typeof NetworkAnalysisInputSchema>;

const NetworkAnalysisOutputSchema = z.object({
  summary: z.string().describe("A one-sentence summary of the network's overall health."),
  details: z.string().describe("A detailed, multi-line report of any anomalies, issues, or important observations. Each finding should be a separate paragraph."),
});
export type NetworkAnalysisOutput = z.infer<typeof NetworkAnalysisOutputSchema>;

export async function analyzeNetwork(input: NetworkAnalysisInput): Promise<NetworkAnalysisOutput> {
  return analyzeNetworkFlow(input);
}

const prompt = ai.definePrompt({
  name: 'networkAnalysisPrompt',
  input: { schema: NetworkAnalysisInputSchema },
  output: { schema: NetworkAnalysisOutputSchema },
  prompt: `You are an expert network operations specialist for a tactical mesh network. Your task is to analyze the provided data from all units and identify any anomalies.

You will receive a list of units with their current data in a highly compact format. Here is the mapping for the field keys:
- i: Unit ID
- t: Unit Type Code
- s: Unit Status Code
- p: Position object, containing 'a' (latitude) and 'o' (longitude)
- v: Speed in km/h
- h: Heading in degrees
- b: Battery percentage
- ts: Timestamp (epoch ms)
- si: Send Interval in seconds
- a: Is Active (1 for true, 0 for false)
- ss: Signal Strength (RSSI) in dBm
- hc: Hop Count

The 't' (type) and 's' (status) fields are numerical codes. Use these current, user-defined mappings:
- Unit Types: {{{json typeMapping}}}
- Unit Statuses: {{{json statusMapping}}}

Analyze the provided list of units:
{{{json units}}}

Use the provided map to look up unit names by their ID ('i' field):
{{{json unitNames}}}

Your analysis should focus on identifying potential issues. Pay close attention to:
1.  **Low Battery:** Any unit with a battery level ('b') below 20% is critical.
2.  **Poor Signal:** A signal strength ('ss') below -95 dBm indicates a weak connection that might become unstable.
3.  **High Hop Count:** A hop count ('hc') greater than 2 suggests inefficient routing or that the unit is far from the gateway.
4.  **Unexpected Offline Status:** An active unit ('a' is 1) that is reported as 'Offline' (status code 5) is a major issue.
5.  **Stale Data:** If a unit's timestamp ('ts') is much older than the current time (by more than 3-5 of its 'si'), it indicates a potential communication loss. The current time is approximately ${Date.now()}.
6.  **Contradictory Status:** For example, a unit with status 'Moving' (code 2) but a speed ('v') of 0, or 'Idle' (code 3) with a high speed.
7.  **Unusual Groupings or Separations:** Mention if units of a group are unexpectedly far apart or if units are clustered in a way that seems tactically unsound.

Provide a concise, one-sentence summary of the network status. Then, provide a detailed, multi-line report of your findings in the 'details' field. If there are no issues, state that the network is operating within normal parameters.
`,
});

const analyzeNetworkFlow = ai.defineFlow(
  {
    name: 'analyzeNetworkFlow',
    inputSchema: NetworkAnalysisInputSchema,
    outputSchema: NetworkAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
        throw new Error("The AI model did not return a valid analysis.");
    }
    return output;
  }
);
