const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const knowledgeBase = fs.readFileSync(path.join(__dirname, 'KNOWLEDGE_BASE.md'), 'utf-8');

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

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

  const systemPrompt = `${knowledgeBase}\n\n---\n\nCONTEXTO ACTUAL: ${hotelContext}\nResponde siempre en español. Sé cálido, claro y conciso. Usa emojis con moderación.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1024,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message.trim() },
        ],
      }),
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? 'Lo siento, no pude generar una respuesta.';
    res.json({ reply });
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Error al comunicarse con el asistente.' });
  }
});

app.listen(PORT, () => {
  console.log('Servidor corriendo en puerto ' + PORT);
});
