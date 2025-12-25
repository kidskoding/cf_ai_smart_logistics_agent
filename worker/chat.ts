import OpenAI from 'openai';
import type { Message, ToolCall } from './types';
import { getToolDefinitions, executeTool } from './tools';
import { ChatCompletionMessageFunctionToolCall } from 'openai/resources/index.mjs';
const SYSTEM_PROMPT = `You are SourceAI, an elite Senior Procurement Specialist for a Fortune 500 manufacturing firm.
Your primary goal is to provide precise, data-driven supplier intelligence for industrial parts and materials.
GUIDELINES:
1. When a user asks about sourcing a part, material, or supplier, ALWAYS prioritize the 'find_suppliers' tool.
2. Present all supplier data in a professional Markdown table with these exact columns: | Company | Contact | Last Order | Reliability | Lead Time |.
3. Maintain a tone that is professional, authoritative, and efficient.
4. If a tool fails, inform the user with a professional explanation (e.g., "I am currently unable to access the historical supplier database for this specific component.")
5. Always summarize the findings after presenting a table, highlighting the best choice based on reliability and lead time.`;
export class ChatHandler {
  private client?: OpenAI;
  private model: string;
  private isMock: boolean = false;
  constructor(aiGatewayUrl: string, apiKey: string, model: string) {
    if (!aiGatewayUrl || !apiKey) {
      this.isMock = true;
      this.model = model;
      return;
    }
    this.client = new OpenAI({
      baseURL: aiGatewayUrl,
      apiKey: apiKey
    });
    this.model = model;
  }
  async processMessage(
    message: string,
    conversationHistory: Message[],
    onChunk?: (chunk: string) => void
  ): Promise<{
    content: string;
    toolCalls?: ToolCall[];
  }> {
    if (this.isMock) {
      const mockResponse = `## Analysis for "${message}"\n\nI have retrieved the following supplier data from our historical procurement database:\n\n| Company | Contact | Last Order | Reliability | Lead Time |\n|---------|---------|------------|-------------|-----------|\n| Precision Machining Ltd | sales@precisionmachining.com | 2024-03-10 | 98% | 5 Days |\n| Vertex Components | orders@vertex.com | 2024-02-15 | 94% | 3 Days |\n| Legacy Parts Co | procurement@legacyparts.co | 2023-11-20 | 91% | 12 Days |\n\n**Strategic Recommendation**: Vertex Components is the preferred choice for immediate needs due to their superior lead time, despite Precision Machining's slightly higher reliability score.`;
      if (onChunk) {
        const words = mockResponse.split(' ');
        for (const word of words) {
          onChunk(word + ' ');
          await new Promise(resolve => setTimeout(resolve, 30));
        }
      }
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
        max_completion_tokens: 16000,
        stream: true,
      });
      return this.handleStreamResponse(stream, message, conversationHistory, onChunk);
    }
    const completion = await this.client!.chat.completions.create({
      model: this.model,
      messages,
      tools: toolDefinitions,
      tool_choice: 'auto',
      max_tokens: 16000,
      stream: false
    });
    return this.handleNonStreamResponse(completion, message, conversationHistory);
  }
  private async handleStreamResponse(
    stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
    message: string,
    conversationHistory: Message[],
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
          const deltaToolCall = delta.tool_calls[i];
          if (!accumulatedToolCalls[i]) {
            accumulatedToolCalls[i] = {
              id: deltaToolCall.id || `tool_${Date.now()}_${i}`,
              type: 'function',
              function: {
                name: deltaToolCall.function?.name || '',
                arguments: deltaToolCall.function?.arguments || ''
              }
            };
          } else {
            if (deltaToolCall.function?.name) accumulatedToolCalls[i].function.name += deltaToolCall.function.name;
            if (deltaToolCall.function?.arguments) accumulatedToolCalls[i].function.arguments += deltaToolCall.function.arguments;
          }
        }
      }
    }
    if (accumulatedToolCalls.length > 0) {
      const executedTools = await this.executeToolCalls(accumulatedToolCalls);
      const finalResponse = await this.generateToolResponse(message, conversationHistory, accumulatedToolCalls, executedTools);
      return { content: finalResponse, toolCalls: executedTools };
    }
    return { content: fullContent };
  }
  private async handleNonStreamResponse(
    completion: OpenAI.Chat.Completions.ChatCompletion,
    message: string,
    conversationHistory: Message[]
  ) {
    const responseMessage = completion.choices[0]?.message;
    if (!responseMessage) return { content: 'Request failed.' };
    if (!responseMessage.tool_calls) {
      return { content: responseMessage.content || 'No response.' };
    }
    const toolCalls = await this.executeToolCalls(responseMessage.tool_calls as ChatCompletionMessageFunctionToolCall[]);
    const finalResponse = await this.generateToolResponse(message, conversationHistory, responseMessage.tool_calls, toolCalls);
    return { content: finalResponse, toolCalls };
  }
  private async executeToolCalls(openAiToolCalls: ChatCompletionMessageFunctionToolCall[]): Promise<ToolCall[]> {
    return Promise.all(
      openAiToolCalls.map(async (tc) => {
        try {
          const args = JSON.parse(tc.function.arguments || '{}');
          const result = await executeTool(tc.function.name, args);
          return { id: tc.id, name: tc.function.name, arguments: args, result };
        } catch (error) {
          return {
            id: tc.id,
            name: tc.function.name,
            arguments: {},
            result: { error: `Procurement Database Access Error: ${error instanceof Error ? error.message : 'Unknown'}` }
          };
        }
      })
    );
  }
  private async generateToolResponse(
    userMessage: string,
    history: Message[],
    openAiToolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[],
    toolResults: ToolCall[]
  ): Promise<string> {
    const followUpCompletion = await this.client!.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history.slice(-3).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage },
        { role: 'assistant', content: null, tool_calls: openAiToolCalls },
        ...toolResults.map((result, index) => ({
          role: 'tool' as const,
          content: JSON.stringify(result.result),
          tool_call_id: openAiToolCalls[index]?.id || result.id
        }))
      ],
      max_tokens: 16000
    });
    return followUpCompletion.choices[0]?.message?.content || 'Data processed.';
  }
  private buildConversationMessages(userMessage: string, history: Message[]) {
    return [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...history.slice(-5).map(m => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: userMessage }
    ];
  }
  updateModel(newModel: string): void {
    this.model = newModel;
  }
}