const amqp = require('amqplib');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));


let channel;

async function connectRabbitMQ() {

  let attempts = 0;
  const maxAttempts = 10;
  while (attempts < maxAttempts){
    try {
      const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
      channel = await connection.createChannel();
      await channel.assertQueue('transaction_notifications');
      console.log('✅ Canal RabbitMQ criado e fila assegurada');
      return;
    } catch (err) {
      attempts++;
      console.log(`❌ Tentativa ${attempts}: falhou - ${err.message}`);
      await sleep(2000);
    }
  }

  throw new Error('❌ Falha ao conectar ao RabbitMQ após varias tentativas');
}

function sendToQueue(msg) {
  if (!channel) {
    console.error('⚠️ Canal RabbitMQ não está conectado ainda');
    return;
  }

  try {
    const sent = channel.sendToQueue('transaction_notification', Buffer.from(JSON.stringify(msg)));
    if (!sent) {
      console.warn('⚠️ Falha ao enfileirar a mensagem:', msg);
    }
  } catch (err) {
    console.error('❌ Erro ao enviar mensagem para fila:', err.message);
  }

  console.log('📤 Enviando mensagem para fila:', msg);
  channel.sendToQueue('transaction_notifications', Buffer.from(JSON.stringify(msg)));

}

module.exports = {
  connectRabbitMQ,
  sendToQueue,
};
