import { config } from 'dotenv';
config();

import '@/ai/flows/ai-draft-payment-reminder.ts';
import '@/ai/flows/ai-overdue-payment-highlight-flow.ts';
import '@/ai/flows/ai-treasurer-expense-summary.ts';