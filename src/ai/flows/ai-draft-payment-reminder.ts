
'use server';
/**
 * @fileOverview A Genkit flow for drafting personalized payment reminders including PayPal links.
 *
 * - draftPaymentReminder - A function that generates a payment reminder message for a player.
 * - DraftPaymentReminderInput - The input type for the draftPaymentReminder function.
 * - DraftPaymentReminderOutput - The return type for the draftPaymentReminder function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { PAYPAL_ME_LINK } from '@/lib/store';

const DraftPaymentReminderInputSchema = z.object({
  playerName: z.string().describe("The name of the player who needs a reminder."),
  outstandingAmount: z.number().describe("The outstanding balance of the player in Euros."),
});
export type DraftPaymentReminderInput = z.infer<typeof DraftPaymentReminderInputSchema>;

const DraftPaymentReminderOutputSchema = z.object({
  reminderMessage: z.string().describe("A personalized payment reminder message for the player."),
});
export type DraftPaymentReminderOutput = z.infer<typeof DraftPaymentReminderOutputSchema>;

export async function draftPaymentReminder(input: DraftPaymentReminderInput): Promise<DraftPaymentReminderOutput> {
  return draftPaymentReminderFlow(input);
}

const prompt = ai.definePrompt({
  name: 'draftPaymentReminderPrompt',
  input: { schema: DraftPaymentReminderInputSchema.extend({ paypalLink: z.string() }) },
  output: { schema: DraftPaymentReminderOutputSchema },
  prompt: `You are an AI assistant for a football team's treasury. Your task is to draft a friendly, yet clear, payment reminder message for a player.
The message should include the player's name, their outstanding balance, and a polite call to action to settle their dues.
Crucially, include the PayPal link for the team treasury so the player can pay easily.

Player Name: {{{playerName}}}
Outstanding Amount: {{{outstandingAmount}}}€
PayPal Link: {{{paypalLink}}}

Draft the reminder message:`,
});

const draftPaymentReminderFlow = ai.defineFlow(
  {
    name: 'draftPaymentReminderFlow',
    inputSchema: DraftPaymentReminderInputSchema,
    outputSchema: DraftPaymentReminderOutputSchema,
  },
  async (input) => {
    // Include the central PayPal link in the prompt
    const { output } = await prompt({
      ...input,
      paypalLink: `${PAYPAL_ME_LINK}/${input.outstandingAmount}`
    });
    return output!;
  }
);
