# web-keyring

O WebKeyring é uma aplicação web projetada para o armazenamento, gestão e compartilhamento seguro de tokens de API, credenciais de banco de dados e chaves SSH criptografadas entre equipes de desenvolvimento e infraestrutura.

## Visão Geral

- **Frontend:** SPA em TypeScript (Vite), servida via Nginx.
- **Backend:** API REST em Python/FastAPI com autenticação (Argon2id + sessões + 2FA/TOTP), criptografia AES-256 dos segredos, rate limiting e trilha de auditoria.
- **Banco de dados:** PostgreSQL 16, com migrations gerenciadas pelo Alembic.

## Como Rodar

### Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) e Docker Compose
- OpenSSL (para gerar as chaves)

### 1. Subir os containers

```bash
docker compose up --build
```

O entrypoint da API aplica as migrations automaticamente antes de subir o servidor.

### 2. Acessar a aplicação

| Serviço   | URL                            |
| --------- | ------------------------------ |
| Frontend  | http://localhost:5173          |
| API       | http://localhost:8000          |
| Docs API  | http://localhost:8000/docs     |

