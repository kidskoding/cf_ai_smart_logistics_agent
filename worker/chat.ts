import OpenAI from 'openai';
import type { Message, ToolCall } from './types';
import { getToolDefinitions, executeTool } from './tools';
import { ChatCompletionMessageFunctionToolCall } from 'openai/resources/index.mjs';
const SYSTEM_PROMPT = `You are SourceAI, an elite Senior Procurement Specialist. Your goal is to provide precise supplier intelligence.
MANDATORY PROCUREMENT PROTOCOL:
1. ALWAYS use 'search_inventory' first if the user mentions parts (RTX, GPU, CPU, etc.) or specific quantities to resolve exact part IDs.
2. If tool results are provided, you MUST transform them into a professional Markdown Table.
3. TABLE SCHEMA (Strict):
   | Supplier | Email | Last Order | Price | Reliability |
4. CALCULATION: If a quantity is requested (e.g. "Order 5"), multiply the quantity by the unit price and display the "Total Estimated Procurement Cost" below the table.
5. If no internal database results are found, explicitly state "Market Estimate provided via External Network" and use the 'find_suppliers' fallback data.
6. Never return empty strings or "Data processed successfully". Always provide the data table.
7. Maintain an authoritative, efficient, and corporate tone.`;
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
      const mockResponse = `Procurement Analysis: Typically I would query the central database for "${message}" and return a supplier comparison table. As I am in simulated mode, please refer to the integration specifications.`;
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
        for (const dtc of delta.tool_calls) {
          const i = dtc.index;
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
    if (!resMsg || !resMsg.tool_calls) return { content: resMsg?.content || 'Service unavailable.' };
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
        { role: 'system', content: SYSTEM_PROMPT + "\n\nCRITICAL: You MUST now summarize the tool results below into the required markdown table format. Do not return empty or placeholder text." },
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
    const content = followUp.choices[0]?.message?.content;
    if (!content || content.trim().length < 10) {
        return "Analysis Error: The procurement database returned valid records, but I was unable to format the report correctly. Please retry your query or check the 'Verified Intelligence' status in the sidebar.";
    }
    return content;
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