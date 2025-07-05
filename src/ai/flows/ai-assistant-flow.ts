
'use server';
/**
 * @fileOverview An AI assistant for the mesh network control center.
 *
 * - aiAssistantFlow - A function that handles user commands and queries.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { Group } from '@/types/mesh';

// Define schemas for tools and flow I/O
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

const AiAssistantInputSchema = z.object({
  query: z.string().describe('The natural language query from the user.'),
  units: z.array(compactUnitSchema).describe('The current state of all units.'),
  groups: z.array(z.object({ id: z.number(), name: z.string() })).describe('The list of all groups.'),
  unitNames: z.record(z.string()).describe("A map of unit IDs to their names."),
});
export type AiAssistantInput = z.infer<typeof AiAssistantInputSchema>;

const SetStatusActionSchema = z.object({
  action: z.literal('SET_STATUS'),
  unitName: z.string().describe('The name of the unit to update.'),
  newStatus: z.enum(["Online", "Moving", "Idle", "Alarm", "Offline", "Maintenance"]),
});

const SendMessageActionSchema = z.object({
  action: z.literal('SEND_MESSAGE'),
  groupName: z.string().describe('The name of the group to send the message to.'),
  message: z.string().describe('The content of the message.'),
});

const ActionSchema = z.discriminatedUnion('action', [
  SetStatusActionSchema,
  SendMessageActionSchema
]);
export type AiAssistantAction = z.infer<typeof ActionSchema>;

const AiAssistantOutputSchema = z.object({
  responseText: z.string().describe("The natural language response to the user, summarizing actions taken or information provided."),
  actions: z.array(ActionSchema).describe("A list of structured action objects that the client application should execute."),
});
export type AiAssistantOutput = z.infer<typeof AiAssistantOutputSchema>;


// Define Tools
const setUnitStatusTool = ai.defineTool(
  {
    name: 'setUnitStatus',
    description: 'Updates the status of a specific unit.',
    inputSchema: z.object({
      unitName: z.string().describe('The name of the unit to update.'),
      newStatus: z.enum(["Online", "Moving", "Idle", "Alarm", "Offline", "Maintenance"]).describe('The new status for the unit.'),
    }),
    outputSchema: SetStatusActionSchema,
  },
  async (input) => {
    // This tool doesn't *actually* change state.
    // It validates the request and returns a structured action for the client to execute.
    return {
      action: 'SET_STATUS',
      unitName: input.unitName,
      newStatus: input.newStatus,
    };
  }
);

const sendMessageTool = ai.defineTool(
    {
        name: 'sendMessageToGroup',
        description: 'Sends a message to a specific group of units.',
        inputSchema: z.object({
            groupName: z.string().describe('The name of the group to receive the message.'),
            message: z.string().describe('The message to send.'),
        }),
        outputSchema: SendMessageActionSchema,
    },
    async (input) => {
        return {
            action: 'SEND_MESSAGE',
            groupName: input.groupName,
            message: input.message,
        };
    }
);

// Define the main flow
export const aiAssistantFlow = ai.defineFlow(
  {
    name: 'aiAssistantFlow',
    inputSchema: AiAssistantInputSchema,
    outputSchema: AiAssistantOutputSchema,
  },
  async ({ query, units, groups, unitNames }) => {
    const llmResponse = await ai.generate({
      prompt: `You are an AI assistant for a tactical command center.
        Your role is to help the operator by answering questions about the network state and executing commands.
        Use the provided tools to perform actions.
        - When a user asks a question (e.g., "which units are offline?"), use the provided data to answer directly. Do not use a tool.
        - When a user issues a command (e.g., "set unit HLF-20 to Alarm"), you MUST use the appropriate tool.
        - When you use a tool, it will return an action object. Collect all action objects generated during your reasoning process.
        - Your final output must be a JSON object with two keys: 'responseText' and 'actions'.
        - 'responseText' should be a concise, natural language confirmation of the actions taken or the information provided.
        - 'actions' should be an array containing all the action objects returned by the tools you used. If you only answered a question, this array should be empty.

        CURRENT CONTEXT:
        - User's Request: "${query}"
        - All Units Data: ${JSON.stringify(units)}
        - All Groups: ${JSON.stringify(groups)}
        - Unit Names (ID to Name): ${JSON.stringify(unitNames)}
      `,
      tools: [setUnitStatusTool, sendMessageTool],
      output: {
        format: 'json',
        schema: AiAssistantOutputSchema,
      },
      model: 'googleai/gemini-2.0-flash',
    });

    const output = llmResponse.output();
    if (!output) {
      return { responseText: "I'm sorry, I could not process that request.", actions: [] };
    }
    return output;
  }
);
