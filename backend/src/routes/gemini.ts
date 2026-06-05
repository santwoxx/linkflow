import { Router, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { verifyFirebaseToken, AuthenticatedRequest } from '../middleware/auth.js';

export const geminiRouter = Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

geminiRouter.post('/generate', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!GEMINI_API_KEY) {
      res.status(500).json({ error: 'GEMINI_API_KEY não configurada no servidor.' });
      return;
    }

    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Campo "prompt" é obrigatório e deve ser uma string.' });
      return;
    }

    if (prompt.length > 5000) {
      res.status(400).json({ error: 'Prompt muito longo. Máximo de 5000 caracteres.' });
      return;
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    res.json({
      success: true,
      text: response.text,
    });
  } catch (error: any) {
    console.error('Erro ao chamar Gemini API:', error);
    res.status(502).json({
      error: 'Falha ao comunicar com a API Gemini.',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});
