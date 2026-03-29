
'use server';
/**
 * @fileOverview A Genkit flow for generating conversation icebreakers during a virtual date.
 * Translated to Russian.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiVideoDateIcebreakersInputSchema = z.object({
  sharedInterests: z
    .string()
    .describe('Строка с общими интересами двух пользователей через запятую.'),
});
export type AiVideoDateIcebreakersInput = z.infer<
  typeof AiVideoDateIcebreakersInputSchema
>;

const AiVideoDateIcebreakersOutputSchema = z.object({
  icebreaker: z.string().describe('Предложенный вопрос для начала разговора.'),
});
export type AiVideoDateIcebreakersOutput = z.infer<
  typeof AiVideoDateIcebreakersOutputSchema
>;

export async function aiVideoDateIcebreakers(
  input: AiVideoDateIcebreakersInput
): Promise<AiVideoDateIcebreakersOutput> {
  return aiVideoDateIcebreakersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiVideoDateIcebreakersPrompt',
  input: {schema: AiVideoDateIcebreakersInputSchema},
  output: {schema: AiVideoDateIcebreakersOutputSchema},
  prompt: `Вы — ИИ-ассистент для свиданий. Ваша цель — помочь двум людям на виртуальном свидании сделать общение более живым и менее неловким, предлагая вопросы для начала разговора ("ледоколы").

Придумайте креативный и интересный вопрос на РУССКОМ ЯЗЫКЕ на основе следующих общих интересов:
Общие интересы: {{{sharedInterests}}}

Вопрос должен быть открытым и стимулировать обсуждение. Выведите только сам вопрос.`,
});

const aiVideoDateIcebreakersFlow = ai.defineFlow(
  {
    name: 'aiVideoDateIcebreakersFlow',
    inputSchema: AiVideoDateIcebreakersInputSchema,
    outputSchema: AiVideoDateIcebreakersOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
