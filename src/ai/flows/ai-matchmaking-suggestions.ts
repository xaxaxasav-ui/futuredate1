
'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating AI-powered matchmaking suggestions.
 * Translated to Russian.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CurrentUserInfoSchema = z.object({
  userId: z.string().describe("Уникальный идентификатор текущего пользователя."),
  name: z.string().describe("Имя текущего пользователя."),
  bio: z.string().describe("Биографическое описание текущего пользователя."),
  personalityAnalysis: z
    .string()
    .describe("Результат ИИ-анализа личности текущего пользователя."),
});
export type CurrentUserInfo = z.infer<typeof CurrentUserInfoSchema>;

const CandidateMatchInfoSchema = z.object({
  userId: z.string().describe("Уникальный идентификатор кандидата."),
  name: z.string().describe("Имя кандидата."),
  bio: z.string().describe("Биографическое описание кандидата."),
  personalityAnalysis: z
    .string()
    .describe("Результат ИИ-анализа личности кандидата."),
});
export type CandidateMatchInfo = z.infer<typeof CandidateMatchInfoSchema>;

const AIMatchmakingSuggestionsInputSchema = z.object({
  currentUser: CurrentUserInfoSchema.describe("Профиль текущего пользователя."),
  candidateMatches: z
    .array(CandidateMatchInfoSchema)
    .describe("Список потенциальных кандидатов."),
});
export type AIMatchmakingSuggestionsInput = z.infer<typeof AIMatchmakingSuggestionsInputSchema>;

const MatchSuggestionSchema = z.object({
  userId: z.string().describe("Идентификатор предложенной пары."),
  name: z.string().describe("Имя предложенной пары."),
  bio: z.string().describe("Биография предложенной пары."),
  compatibilityExplanation: z
    .string()
    .describe("Объяснение совместимости на русском языке."),
  compatibilityScore: z.number().int().min(1).max(100).describe("Оценка совместимости от 1 до 100."),
});
export type MatchSuggestion = z.infer<typeof MatchSuggestionSchema>;

const AIMatchmakingSuggestionsOutputSchema = z.object({
  suggestions: z.array(MatchSuggestionSchema).describe("Список рекомендаций по подбору пар."),
});
export type AIMatchmakingSuggestionsOutput = z.infer<typeof AIMatchmakingSuggestionsOutputSchema>;

const CalculateCompatibilityPromptInputSchema = z.object({
  user1Name: z.string(),
  user1Bio: z.string(),
  user1PersonalityAnalysis: z.string(),
  user2Name: z.string(),
  user2Bio: z.string(),
  user2PersonalityAnalysis: z.string(),
});

const CalculateCompatibilityPromptOutputSchema = z.object({
  compatibilityExplanation: z.string(),
  compatibilityScore: z.number().int().min(1).max(100),
});

const calculateCompatibilityPrompt = ai.definePrompt({
  name: 'calculateCompatibilityPrompt',
  input: { schema: CalculateCompatibilityPromptInputSchema },
  output: { schema: CalculateCompatibilityPromptOutputSchema },
  prompt: `Проанализируйте совместимость между двумя людьми на основе их биографий и психологических портретов.
Предоставьте четкое объяснение их совместимости на РУССКОМ ЯЗЫКЕ и присвойте числовой балл от 1 до 100.

---
Пользователь 1:
Имя: {{{user1Name}}}
Биография: {{{user1Bio}}}
Анализ личности: {{{user1PersonalityAnalysis}}}

---
Пользователь 2:
Имя: {{{user2Name}}}
Биография: {{{user2Bio}}}
Анализ личности: {{{user2PersonalityAnalysis}}}

---
На основе приведенной выше информации составьте подробное объяснение совместимости и оценку в формате JSON.`,
});

const aiMatchmakingSuggestionsFlow = ai.defineFlow(
  {
    name: 'aiMatchmakingSuggestionsFlow',
    inputSchema: AIMatchmakingSuggestionsInputSchema,
    outputSchema: AIMatchmakingSuggestionsOutputSchema,
  },
  async (input) => {
    const suggestions: MatchSuggestion[] = [];

    for (const candidate of input.candidateMatches) {
      const promptInput = {
        user1Name: input.currentUser.name,
        user1Bio: input.currentUser.bio,
        user1PersonalityAnalysis: input.currentUser.personalityAnalysis,
        user2Name: candidate.name,
        user2Bio: candidate.bio,
        user2PersonalityAnalysis: candidate.personalityAnalysis,
      };

      const { output } = await calculateCompatibilityPrompt(promptInput);

      if (output) {
        suggestions.push({
          userId: candidate.userId,
          name: candidate.name,
          bio: candidate.bio,
          compatibilityExplanation: output.compatibilityExplanation,
          compatibilityScore: output.compatibilityScore,
        });
      }
    }
    return { suggestions };
  }
);

export async function aiMatchmakingSuggestions(
  input: AIMatchmakingSuggestionsInput
): Promise<AIMatchmakingSuggestionsOutput> {
  return aiMatchmakingSuggestionsFlow(input);
}
