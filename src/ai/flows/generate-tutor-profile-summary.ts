'use server';
/**
 * @fileOverview A flow to generate a concise summary for a tutor's profile.
 *
 * - generateTutorProfileSummary - A function that handles generating the summary.
 * - GenerateTutorProfileSummaryInput - The input type for the function.
 * - GenerateTutorProfileSummaryOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTutorProfileSummaryInputSchema = z.object({
  profileDetails: z
    .string()
    .describe('The detailed bio and introduction provided by the tutor.'),
});
export type GenerateTutorProfileSummaryInput = z.infer<typeof GenerateTutorProfileSummaryInputSchema>;

const GenerateTutorProfileSummaryOutputSchema = z.object({
  summary: z
    .string()
    .describe('A concise, professional, and engaging summary for the tutor profile, written in the third person.'),
});
export type GenerateTutorProfileSummaryOutput = z.infer<typeof GenerateTutorProfileSummaryOutputSchema>;

export async function generateTutorProfileSummary(input: GenerateTutorProfileSummaryInput): Promise<GenerateTutorProfileSummaryOutput> {
  return generateTutorProfileSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTutorProfileSummaryPrompt',
  input: {schema: GenerateTutorProfileSummaryInputSchema},
  output: {schema: GenerateTutorProfileSummaryOutputSchema},
  prompt: `You are an expert copywriter specializing in creating compelling online profiles for educators and tutors.

Your task is to generate a short, professional, and engaging summary for a tutor's public profile based on the detailed information they provide. The summary should be written in the third person and highlight their key strengths, experience, and teaching style to attract potential students.

Use the following as the source of information.

Tutor's Introduction:
{{{profileDetails}}}
`,
});

const generateTutorProfileSummaryFlow = ai.defineFlow(
  {
    name: 'generateTutorProfileSummaryFlow',
    inputSchema: GenerateTutorProfileSummaryInputSchema,
    outputSchema: GenerateTutorProfileSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
