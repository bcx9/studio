
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
import { CODE_TO_UNIT_STATUS, CODE_TO_UNIT_TYPE } from '@/types/mesh';

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

const NetworkAnalysisInputSchema = z.object({
  units: z.array(compactUnitSchema),
  unitNames: z.record(z.string()).describe("A map of unit IDs to their names."),
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

You will receive a list of units with their current data. The 'type' and 'status' fields are numerical codes. Here are the mappings:
- Unit Types: ${JSON.stringify(CODE_TO_UNIT_TYPE)}
- Unit Statuses: ${JSON.stringify(CODE_TO_UNIT_STATUS)}

Analyze the provided list of units:
{{{json units}}}

Use the provided map to look up unit names by their ID:
{{{json unitNames}}}

Your analysis should focus on identifying potential issues. Pay close attention to:
1.  **Low Battery:** Any unit with a battery level below 20% is critical.
2.  **Unexpected Offline Status:** An active unit that is reported as 'Offline' is a major issue.
3.  **Stale Data:** If a unit's timestamp is much older than the current time (by more than 3-5 of its sendIntervals), it indicates a potential communication loss. The current time is approximately ${Date.now()}.
4.  **Contradictory Status:** For example, a unit with status 'Moving' but a speed of 0, or 'Idle' with a high speed.
5.  **Unusual Groupings or Separations:** Mention if units of a group are unexpectedly far apart or if units are clustered in a way that seems tactically unsound.

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
