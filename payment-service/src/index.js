const runMigrations = require('./migrations');
const { connectRabbitMQ, sendToQueue } = require('./rabbitmq');
const express = require('express');
const pool = require('./db');

const app = express();
const port = 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.send('Payment Service is running');
});

app.post('/transactions', async (req, res) => {
  const { user_email, amount } = req.body;

  if (!user_email || !amount) {
    return res.status(400).json({ error: 'user_email e amount são obrigatórios' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO transactions (user_email, amount, status) VALUES ($1, $2, $3) RETURNING *',
      [user_email, amount, 'pendente']
    );

    sendToQueue({
      type: 'transacao_recebida',
      transaction: result.rows[0],
    });

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao salvar transação:', err);
    res.status(500).json({ error: 'Erro interno ao salvar transação' });
  }
});

app.patch('/transactions/:id/confirm', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'UPDATE transactions SET status = $1 WHERE id = $2 RETURNING *',
      ['sucesso', id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    sendToQueue({
      type: 'transacao_confirmada',
      transaction: result.rows[0],
    });

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao confirmar transação:', err);
    res.status(500).json({ error: 'Erro interno ao confirmar transação' });
  }
});

app.get('/transactions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM transactions ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Erro ao buscar transações: ', err);
    res.status(500).json({error: 'Erro interno ao buscar transações!'});
  }
});

async function startServer() {  
  try {
    await runMigrations();
    await connectRabbitMQ();

    app.listen(port, () => {
      console.log(`🚀 Payment Service running at http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Erro ao iniciar serviço:', err);
    process.exit(1);
  }
}

startServer();