const amqp = require('amqplib');

async function connectAndConsume(attempt = 1) {
  const MAX_ATTEMPTS = 10;
  const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq';

  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    const queue = 'transaction_notifications';
    await channel.assertQueue(queue);

    console.log('📡 Aguardando mensagens da fila:', queue);

    channel.consume(queue, (msg) => {
      if (msg !== null) {
        const content = JSON.parse(msg.content.toString());
        console.log('📨 Mensagem recebida:', content);

        if (content.type === 'transacao_recebida') {
          const { user_email, amount } = content.transaction;
          console.log(`📨 Notificação: Recebemos uma nova transação de ${user_email} no valor de R$ ${amount}`);
        }

        if (content.type === 'transacao_confirmada') {
          const { user_email, amount } = content.transaction;
          console.log(`✅ Notificação: A transação de ${user_email} no valor de R$ ${amount} foi confirmada com sucesso!`);
        }

        channel.ack(msg);
      }
    });
  } catch (err) {
    console.error(`❌ Erro ao conectar ou consumir fila (tentativa ${attempt}):`, err.message);

    if (attempt < MAX_ATTEMPTS) {
      setTimeout(() => connectAndConsume(attempt + 1), 2000);
    } else {
      console.error('❌ Falha ao conectar ao RabbitMQ após várias tentativas.');
      process.exit(1);
    }
  }
}

connectAndConsume();
