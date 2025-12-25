import OpenAI from 'openai';
import type { Message, ToolCall } from './types';
import { getToolDefinitions, executeTool } from './tools';
import { ChatCompletionMessageFunctionToolCall } from 'openai/resources/index.mjs';
const SYSTEM_PROMPT = `You are SourceAI, an elite Senior Procurement Specialist.
Your primary goal is to provide precise, data-driven supplier intelligence and manage the enterprise parts inventory.
GUIDELINES:
1. ALWAYS prioritize searching internal inventory first using 'search_inventory' to find exact part numbers or internal component matches.
2. If exact matches are found in the inventory, use those specific part descriptions or numbers when calling 'find_suppliers'.
3. PRESENT DATA IN PROFESSIONAL MARKDOWN TABLES. Use these exact headers for supplier lookups: 
   | Company Name | Contact Email | Last Order Date | Reliability Score | Lead Time |
4. If no results are found in the internal inventory, inform the user but still offer to perform a general 'find_suppliers' search based on their description.
5. Summarize findings by highlighting reliability scores and potential lead times. 
6. Maintain an authoritative, efficient, and corporate tone.
7. Positioning: Refer users to '/api/parts' as the central registry for full catalog audits.`;
export class ChatHandler {
  private client?: OpenAI;
  private model: string;
  private isMock: boolean = false;
  private env: any;
  constructor(aiGatewayUrl: string, apiKey: string, model: string, env?: any) {
    this.env = env;
    if (!aiGatewayUrl || !apiKey) {
      this.isMock = true;
      this.model = model;
      return;
    }
    this.client = new OpenAI({ baseURL: aiGatewayUrl, apiKey: apiKey });
    this.model = model;
  }
  async processMessage(
    message: string,
    conversationHistory: Message[],
    onChunk?: (chunk: string) => void
  ): Promise<{ content: string; toolCalls?: ToolCall[] }> {
    if (this.isMock) {
      const mockResponse = `I have analyzed your request for "${message}". As I am currently in simulated mode, I cannot access the live database, but typically I would search our inventory and then provide a list of verified suppliers in a formatted table. You can inspect the full Central Inventory Registry at the /api/parts endpoint.`;
      if (onChunk) onChunk(mockResponse);
      return { content: mockResponse };
    }
    const messages = this.buildConversationMessages(message, conversationHistory);
    const toolDefinitions = await getToolDefinitions();
    if (onChunk) {
      const stream = await this.client!.chat.completions.create({
        model: this.model,
        messages,
        tools: toolDefinitions,
        tool_choice: 'auto',
        stream: true,
      });
      return this.handleStreamResponse(stream, message, conversationHistory, onChunk);
    }
    const completion = await this.client!.chat.completions.create({
      model: this.model,
      messages,
      tools: toolDefinitions,
      tool_choice: 'auto',
      stream: false
    });
    return this.handleNonStreamResponse(completion, message, conversationHistory);
  }
  private async handleStreamResponse(
    stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
    message: string,
    history: Message[],
    onChunk: (chunk: string) => void
  ) {
    let fullContent = '';
    const accumulatedToolCalls: ChatCompletionMessageFunctionToolCall[] = [];
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        fullContent += delta.content;
        onChunk(delta.content);
      }
      if (delta?.tool_calls) {
        for (let i = 0; i < delta.tool_calls.length; i++) {
          const dtc = delta.tool_calls[i];
          if (!accumulatedToolCalls[i]) {
            accumulatedToolCalls[i] = {
              id: dtc.id || `tool_${i}`,
              type: 'function',
              function: { name: dtc.function?.name || '', arguments: dtc.function?.arguments || '' }
            };
          } else {
            if (dtc.function?.name) accumulatedToolCalls[i].function.name += dtc.function.name;
            if (dtc.function?.arguments) accumulatedToolCalls[i].function.arguments += dtc.function.arguments;
          }
        }
      }
    }
    if (accumulatedToolCalls.length > 0) {
      const executedTools = await this.executeToolCalls(accumulatedToolCalls);
      const finalResponse = await this.generateToolResponse(message, history, accumulatedToolCalls, executedTools);
      return { content: finalResponse, toolCalls: executedTools };
    }
    return { content: fullContent };
  }
  private async handleNonStreamResponse(completion: OpenAI.Chat.Completions.ChatCompletion, message: string, history: Message[]) {
    const resMsg = completion.choices[0]?.message;
    if (!resMsg || !resMsg.tool_calls) return { content: resMsg?.content || 'Error' };
    const toolCalls = await this.executeToolCalls(resMsg.tool_calls as ChatCompletionMessageFunctionToolCall[]);
    const finalResponse = await this.generateToolResponse(message, history, resMsg.tool_calls, toolCalls);
    return { content: finalResponse, toolCalls };
  }
  private async executeToolCalls(openAiToolCalls: ChatCompletionMessageFunctionToolCall[]): Promise<ToolCall[]> {
    return Promise.all(
      openAiToolCalls.map(async (tc) => {
        try {
          const args = JSON.parse(tc.function.arguments || '{}');
          const result = await executeTool(tc.function.name, args, this.env);
          return { id: tc.id, name: tc.function.name, arguments: args, result };
        } catch (error) {
          return { id: tc.id, name: tc.function.name, arguments: {}, result: { error: String(error) } };
        }
      })
    );
  }
  private async generateToolResponse(
    userMsg: string,
    history: Message[],
    openAiTC: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[],
    results: ToolCall[]
  ): Promise<string> {
    const followUp = await this.client!.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history.slice(-10).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMsg },
        { role: 'assistant', content: null, tool_calls: openAiTC },
        ...results.map((res, i) => ({
          role: 'tool' as const,
          content: JSON.stringify(res.result),
          tool_call_id: openAiTC[i]?.id || res.id
        }))
      ]
    });
    return followUp.choices[0]?.message?.content || 'Data processed successfully.';
  }
  private buildConversationMessages(userMessage: string, history: Message[]) {
    return [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...history.slice(-10).map(m => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: userMessage }
    ];
  }
  updateModel(newModel: string): void { this.model = newModel; }
}