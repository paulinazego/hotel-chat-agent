require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const Groq = require('groq-sdk');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Leer el knowledge base al iniciar
const knowledgeBase = fs.readFileSync(path.join(__dirname, 'KNOWLEDGE_BASE.md'), 'utf-8');

if (!process.env.GROQ_API_KEY) {
  console.error('ERROR: La variable de entorno GROQ_API_KEY no está definida.');
  process.exit(1);
}
const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.post('/chat', async (req, res) => {
  const { message, hotel } = req.body;

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
  }

  const hotelContext =
    hotel === 'bonito'
      ? 'El usuario está consultando sobre el HOTEL BONITO específicamente.'
      : hotel === 'bellavista'
      ? 'El usuario está consultando sobre el HOTEL BELLAVISTA específicamente.'
      : 'El usuario está consultando sobre ambos hoteles (Hotel Bonito y Hotel Bellavista).';

  const systemPrompt = `${knowledgeBase}

---

CONTEXTO ACTUAL: ${hotelContext}
Responde siempre en español. Sé cálido, claro y conciso. Usa emojis con moderación.`;

  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message.trim() },
      ],
    });

    const reply = response.choices[0]?.message?.content ?? 'Lo siento, no pude generar una respuesta.';
    res.json({ reply });
  } catch (err) {
    console.error('Error al llamar a la API de Anthropic:', err.message);
    res.status(500).json({ error: 'Error al comunicarse con el asistente. Intenta de nuevo.' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
