/**
 * AI Provider Interface
 * Defines the contract for AI services (e.g., Gemini, OpenAI).
 */
export interface AIProvider {
  generateText(prompt: string, options?: any): Promise<string>;
  generateJson(prompt: string, schema: any, options?: any): Promise<any>;
  generateImage(prompt: string, options?: any): Promise<string>; // Returns image URL or base64
}

/**
 * Gemini Provider implementation using @google/generative-ai
 */
import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiProvider implements AIProvider {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string, modelName = 'gemini-1.5-pro') {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: modelName });
  }

  async generateText(prompt: string, options = {}) {
    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  async generateJson(prompt: string, schema: any, options = {}) {
    // Gemini 1.5 supports constrained output (JSON mode)
    const result = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });
    const response = await result.response;
    return JSON.parse(response.text());
  }

  async generateImage(prompt: string, options = {}) {
    // Note: Imagen is typically handled via a different API or Vertex AI
    // This is a placeholder for the interface implementation
    throw new Error('Image generation not yet implemented for GeminiProvider');
  }
}
