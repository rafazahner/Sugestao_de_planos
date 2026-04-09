# Sugestao de Planos

Aplicacao React com backend Node/Express para consultar o Movidesk e enviar o payload ao webhook do BotConversa sem depender de proxy publico.

## Como rodar

1. Instale as dependencias:
   `npm install`
2. Configure as variaveis em `.env` com base no `.env.example`.
3. Rode em desenvolvimento:
   `npm run dev`
4. Acesse:
   `http://localhost:3002`

## Producao

1. Gere o build:
   `npm run build`
2. Inicie o servidor:
   `npm run start`

O servidor expoe as rotas:

- `GET /api/health`
- `GET /api/units`
- `GET /api/check-user-role?email=...`
- `POST /api/submit-ticket`

## Variaveis de ambiente

- `MOVIDESK_TOKEN`
- `BOTCONVERSA_WEBHOOK`
- `PORT`
