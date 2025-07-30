import type { Express } from 'express';

export function setupWebhookTest(app: Express) {
  // Route pour tester les webhooks côté serveur (évite CORS)
  app.post('/api/webhook/test', async (req, res) => {
    console.log('🧪 WEBHOOK TEST - Route called');
    
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ 
          success: false, 
          error: 'URL manquante' 
        });
      }

      console.log('🧪 Testing webhook URL:', url);

      const testData = {
        test: true,
        timestamp: new Date().toISOString(),
        message: "Test depuis l'Assistant Webhook LogiFlow (serveur)"
      };

      // Utiliser node-fetch ou fetch natif avec timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const result = {
        success: true,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      };

      console.log('🧪 Webhook test result:', result);
      res.json(result);

    } catch (error: any) {
      console.error('🧪 Webhook test error:', error);
      
      let errorMessage = 'Erreur inconnue';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Timeout: Le webhook n\'a pas répondu dans les 10 secondes';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'URL introuvable - Vérifiez le nom de domaine';
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Connexion refusée - Vérifiez que le serveur est en ligne';
      } else if (error.message) {
        errorMessage = error.message;
      }

      res.json({
        success: false,
        error: errorMessage,
        code: error.code,
        name: error.name
      });
    }
  });

  console.log('🧪 Webhook test route registered');
}