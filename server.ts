import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config(); // Load .env
dotenv.config({ path: '.env.example' }); // Fallback to .env.example if used by user

async function startServer() {
  const app = express();
  const PORT = 3000;
  const isProd = process.env.NODE_ENV === 'production';
  const distPath = path.join(process.cwd(), 'dist');

  app.use(express.json({ limit: '50mb' }));

  // API Route for Gemini
  app.post('/api/gemini', async (req, res) => {
    console.log('[API] Received Gemini request');
    try {
      const apiKey = process.env.GEMINI_API_KEY?.trim();
      if (!apiKey || apiKey === 'your_api_key_here' || apiKey === 'YOUR_API_KEY') {
        console.error('[API] Missing Gemini API Key');
        return res.status(500).json({ error: 'API key is missing or invalid. Please check your Applet Settings.' });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const { model, config, contents } = req.body;
      console.log(`[API] Calling model: ${model}`);

      const response = await ai.models.generateContent({ model, config, contents });
      
      if (!response.text) {
        console.warn('[API] Empty response from Gemini');
      }

      res.json({ text: response.text });
    } catch (e: any) {
      console.error('[API] Gemini Error:', e);
      // Improve the error message for invalid API key
      if (e.message && e.message.includes('API key not valid')) {
        return res.status(401).json({ error: 'API key is invalid. Please check your Applet Settings.' });
      }
      res.status(500).json({ error: e.message || 'Internal error' });
    }
  });

  // Vite middleware for development
  if (!isProd) {
    console.log('Starting in DEVELOPMENT mode');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Starting in PRODUCTION mode');
    // Serve static files in production
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Cloud Run sets process.env.PORT, AI Studio uses 3000
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
