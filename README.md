Desafio 2 - Desenvolvimento de Sistemas Móveis e Distribuídos - Aplicação de Pagamento

✅ Requisitos

    Docker

    Docker Compose

    Portas liberadas:

    3000 (payment-service)

    5432 (PostgreSQL)

    15672 (RabbitMQ Management)

🚀 Subindo os Serviços

    docker-compose up --build

        Sobe o banco de dados Postgres

        Sobe o RabbitMQ com interface de gerenciamento

        Inicia os microsserviços payment-service e notification-service

🌐 Verificação Inicial

    Acesse: http://localhost:3000/health

    Resposta esperada: Payment Service is running

    Painel do RabbitMQ

        Acesse: http://localhost:15672

        Usuário: guest   Senha: guest

🧪 Testes de Funcionalidade

    1. Criar uma Transação

        curl -X POST http://localhost:3000/transactions \
          -H "Content-Type: application/json" \
          -d '{"user_email": "cliente@teste.com", "amount": 99.90}'

        🔎 Esperado:

            Transação com status "pendente" no banco

            Mensagem publicada no RabbitMQ

            notification-service imprime:

            📨 Notificação: Recebemos uma nova transação de cliente@teste.com no valor de R$ 99.9

    2. Confirmar a Transação

        curl -X PATCH http://localhost:3000/transactions/1/confirm

        🔎 Esperado:

            Status atualizado para "sucesso"

            Nova mensagem publicada

            notification-service imprime:

            ✅ Notificação: A transação de cliente@teste.com no valor de R$ 99.9 foi confirmada com sucesso!

    3. Listar Transações

        curl http://localhost:3000/transactions

        🔎 Esperado: JSON com todas as transações cadastradas.

        🔎 Verificando a Fila no RabbitMQ

        Acesse o painel em:

            http://localhost:15672
    
            Menu lateral: Queues > transaction_notifications
    
            Verifique:
    
            Consumers > 0 (serviço de notificação ativo)
    
            Messages aumenta quando mensagens são enviadas


