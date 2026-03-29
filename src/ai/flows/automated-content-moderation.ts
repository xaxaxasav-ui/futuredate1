
'use server';
/**
 * @fileOverview Automated content moderation flow.
 * Translated logic to Russian messages.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutomatedContentModerationInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "Фото для модерации в формате data URI."
    ),
});
export type AutomatedContentModerationInput = z.infer<
  typeof AutomatedContentModerationInputSchema
>;

const AutomatedContentModerationOutputSchema = z.object({
  isSafe: z
    .boolean()
    .describe('Является ли контент на фото безопасным.'),
  moderationReason: z
    .string()
    .describe('Причина блокировки на русском языке, если контент небезопасен.'),
});
export type AutomatedContentModerationOutput = z.infer<
  typeof AutomatedContentModerationOutputSchema
>;

export async function automatedContentModeration(
  input: AutomatedContentModerationInput
): Promise<AutomatedContentModerationOutput> {
  return automatedContentModerationFlow(input);
}

const moderationPrompt = ai.definePrompt({
  name: 'automatedContentModerationPrompt',
  input: {schema: AutomatedContentModerationInputSchema},
  output: {schema: AutomatedContentModerationOutputSchema},
  config: {
    safetySettings: [
      {category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE'},
      {category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE'},
      {category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE'},
      {category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE'},
    ],
  },
  prompt: [
    {
      text: `Вы — система ИИ-модерации контента. Ваша задача — проанализировать изображение на наличие неприемлемого контента (откровенные сцены, ненависть, домогательства, опасный контент).

Если изображение неприемлемо, установите 'isSafe' в false и укажите краткую причину 'moderationReason' на РУССКОМ ЯЗЫКЕ.
Если изображение безопасно, установите 'isSafe' в true.

Ответьте ТОЛЬКО JSON-объектом:
${JSON.stringify(AutomatedContentModerationOutputSchema.toJsonSchema(), null, 2)}
`,
    },
    {
      media: {url: '{{{photoDataUri}}}'},
    },
  ],
});

const automatedContentModerationFlow = ai.defineFlow(
  {
    name: 'automatedContentModerationFlow',
    inputSchema: AutomatedContentModerationInputSchema,
    outputSchema: AutomatedContentModerationOutputSchema,
  },
  async input => {
    try {
      const {output} = await moderationPrompt(input);
      if (!output) {
        return {
          isSafe: false,
          moderationReason: 'Контент заблокирован внутренними фильтрами безопасности или произошел сбой генерации.',
        };
      }
      return output;
    } catch (e: any) {
      const errorMessage = e.message || 'Произошла неизвестная ошибка при модерации.';
      console.error('Content moderation failed:', errorMessage);
      return {
        isSafe: false,
        moderationReason: `Ошибка модерации: ${errorMessage}`,
      };
    }
  }
);
