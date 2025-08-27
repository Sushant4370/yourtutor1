/**
 * @fileoverview This file initializes the Genkit AI instance with necessary plugins.
 * It serves as the central point for Genkit configuration.
 */
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
