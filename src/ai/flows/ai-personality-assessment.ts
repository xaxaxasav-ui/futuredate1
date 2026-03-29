'use server';
/**
 * @fileOverview This file implements a Genkit flow for dynamic AI personality assessment.
 * Translated to Russian. Corrected for Genkit 1.x tool usage and model config.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AIMessageSchema = z.object({
  role: z.enum(['user', 'model']).describe('Роль отправителя (user или model).'),
  content: z.string().describe('Содержимое сообщения.'),
});
export type AIMessage = z.infer<typeof AIMessageSchema>;

const AIPersonalityAssessmentInputSchema = z.object({
  userId: z.string().describe('ID пользователя.'),
  chatHistory: z.array(AIMessageSchema).describe('История переписки.').default([]),
  userMessage: z.string().describe('Последнее сообщение пользователя.'),
  isInitialCall: z.boolean().optional().describe('True, если это первый вызов для начала оценки.'),
});
export type AIPersonalityAssessmentInput = z.infer<typeof AIPersonalityAssessmentInputSchema>;

const AIPersonalityAssessmentOutputSchema = z.object({
  aiResponse: z.string().optional().describe('Ответ ИИ-психолога.'),
  isAssessmentComplete: z.boolean().default(false).describe('True, если оценка завершена.'),
  personalityProfileText: z.string().optional().describe('Текстовое описание личности.'),
  personalityVector: z.array(z.number()).optional().describe('Эмбеддинг вектора личности.'),
  updatedChatHistory: z.array(AIMessageSchema).describe('Обновленная история переписки.'),
});
export type AIPersonalityAssessmentOutput = z.infer<typeof AIPersonalityAssessmentOutputSchema>;

const generatePersonalityEmbeddingsTool = ai.defineTool(
  {
    name: 'generatePersonalityEmbeddings',
    description: 'Генерирует числовой вектор (эмбеддинг), представляющий описание личности пользователя. Вызывайте этот инструмент ОБЯЗАТЕЛЬНО, когда соберете достаточно информации (обычно после 3-5 вопросов) для завершения оценки.',
    inputSchema: z.object({
      personalityDescription: z.string().describe('Подробное резюме черт характера, ценностей и предпочтений пользователя на основе диалога.'),
    }),
    outputSchema: z.array(z.number()).describe('Вектор чисел, представляющий описание личности.'),
  },
  async (input) => {
    const embeddingsResponse = await ai.embed({
      model: 'googleai/text-embedding-004',
      content: input.personalityDescription,
    });
    if (!embeddingsResponse || !embeddingsResponse.embedding) {
      throw new Error('Не удалось сгенерировать эмбеддинги для описания личности.');
    }
    return embeddingsResponse.embedding;
  }
);

const aiPersonalityAssessmentFlow = ai.defineFlow(
  {
    name: 'aiPersonalityAssessmentFlow',
    inputSchema: AIPersonalityAssessmentInputSchema,
    outputSchema: AIPersonalityAssessmentOutputSchema,
  },
  async (input) => {
    let currentChatHistory = [...input.chatHistory];
    let aiResponse = '';
    let isAssessmentComplete = false;
    let personalityProfileText: string | undefined;
    let personalityVector: number[] | undefined;

    const systemInstructions = `Вы — ИИ-психолог "Свидания будущего". Ваша цель — провести глубокую оценку личности пользователя через серию из 3-5 необычных психологических вопросов.
Общайтесь на русском языке. Поддерживайте эмпатичный и вовлекающий тон. Задавайте по ОДНОМУ вопросу за раз.

Когда вы соберете достаточно информации о характере пользователя, вы ДОЛЖНЫ вызвать инструмент 'generatePersonalityEmbeddings'. 
В аргументе 'personalityDescription' передайте итоговый психологический портрет пользователя на русском языке.
После вызова инструмента сообщите пользователю, что его нейронный профиль успешно создан.`;

    const messages: any[] = [
      { role: 'system', content: [{ text: systemInstructions }] }
    ];

    if (input.isInitialCall) {
      const initialGreeting = "Здравствуйте! Я ваш ИИ-психолог. Я помогу вам раскрыть вашу уникальную личность для более точного поиска партнеров в будущем. Начнем с необычного вопроса. Представьте, что вы оказались на необитаемом острове и можете взять с собой только три вещи. Что бы это было и почему?";
      currentChatHistory.push({ role: 'model', content: initialGreeting });
      return {
        aiResponse: initialGreeting,
        isAssessmentComplete: false,
        updatedChatHistory: currentChatHistory,
      };
    }

    // Add history to current messages for generation
    input.chatHistory.forEach(msg => {
      messages.push({ role: msg.role, content: [{ text: msg.content }] });
    });

    // Add latest user message
    messages.push({ role: 'user', content: [{ text: input.userMessage }] });
    currentChatHistory.push({ role: 'user', content: input.userMessage });

    const modelResponse = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: messages,
      tools: [generatePersonalityEmbeddingsTool],
      config: {
        safetySettings: [
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        ],
      },
    });

    const toolCalls = modelResponse.toolCalls;
    if (toolCalls && toolCalls.length > 0) {
      const toolCall = toolCalls[0];
      if (toolCall.name === 'generatePersonalityEmbeddings') {
        const args = toolCall.args as { personalityDescription: string };
        personalityProfileText = args.personalityDescription;

        // Execute tool logic manually to get results for the flow output
        const embeddings = await generatePersonalityEmbeddingsTool(args);
        personalityVector = embeddings;
        isAssessmentComplete = true;

        aiResponse = `Ваш нейронный профиль сформирован: "${personalityProfileText}". Мы добавили ваш уникальный вектор в базу данных для поиска идеальных пар.`;
      }
    } else {
      aiResponse = modelResponse.text;
    }

    if (!aiResponse) {
      aiResponse = "Интересная мысль. Расскажите об этом подробнее?";
    }

    currentChatHistory.push({ role: 'model', content: aiResponse });

    return {
      aiResponse,
      isAssessmentComplete,
      personalityProfileText,
      personalityVector,
      updatedChatHistory: currentChatHistory,
    };
  }
);

export async function aiPersonalityAssessment(input: AIPersonalityAssessmentInput): Promise<AIPersonalityAssessmentOutput> {
  return aiPersonalityAssessmentFlow(input);
}
