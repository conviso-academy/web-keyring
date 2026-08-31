# Web-Keyring

O **Web-Keyring** é uma aplicação web segura projetada para o armazenamento, gestão, versionamento e compartilhamento controlado de segredos corporativos tais como tokens de API, credenciais de banco de dados, certificados e chaves SSH entre equipes de desenvolvimento e infraestrutura.

O sistema segue princípios rigorosos de *Security-by-Design*, aplicando criptografia em repouso e em trânsito, autenticação em duas etapas (2FA/TOTP) obrigatória, isolamento de rede, princípio do menor privilégio em containers e trilha de auditoria imutável.

---

## 1. Visão Geral e Tecnologias

A aplicação é estruturada em uma arquitetura de três camadas conteinerizada:

- **Frontend:** SPA desenvolvida em TypeScript puro empacotada com [Vite](https://vitejs.dev/), servida por servidor web [Nginx](https://nginx.org/) com políticas estritas de segurança e cabeçalhos defensivos (CSP, HSTS, X-Content-Type-Options, etc.).
- **Backend:** API REST assíncrona desenvolvida em Python 3.12 com [FastAPI](https://fastapi.tiangolo.com/), [SQLAlchemy 2.0](https://www.sqlalchemy.org/) para mapeamento objeto-relacional e [Alembic](https://alembic.sqlalchemy.org/) para controle e versionamento automático de migrações de banco de dados.
- **Banco de Dados:** [PostgreSQL 16](https://www.postgresql.org/) (Alpine) operando em rede Docker interna isolada sem portas expostas diretamente para o host.

---

## 2. Arquitetura

O sistema adota o padrão monolítico em três camadas isoladas, centralizando o controle de acesso e regras de negócio na camada de backend para garantir rastreabilidade completa e proteção contra vulnerabilidades de controle de acesso (como IDOR).

Para detalhes sobre o modelo de dados, fluxos de autenticação, diagrama estrutural e políticas de segurança, consulte a documentação dedicada:

- [Documento de Arquitetura](docs/arquitetura.md) Diagramas conceituais, fluxos de sequência (login em duas etapas e revelação sob demanda), especificação do banco de dados e detalhes de rede.
- [Política de Segurança](docs/security_policy.md) Diretrizes de segurança, ciclo de vida de senhas, conformidade, requisitos de criptografia e gestão de vulnerabilidades.

---

## 3. Pilares e Mecanismos de Segurança

- **Criptografia Simétrica de Alto Padrão:** Os valores confidenciais dos segredos e as sementes do TOTP são criptografados com **AES-256-GCM**, garantindo confidencialidade e integridade autenticada.
- **Hash de Senha com Argon2id:** As senhas dos usuários utilizam o algoritmo vencedor do *Password Hashing Competition* (**Argon2id**) com alto custo de memória e tempo para mitigar ataques de força bruta e aceleração por GPU/ASIC.
- **Autenticação Multifator (2FA / TOTP):** Implementação compatível com a RFC 6238 (Google Authenticator, Bitwarden, etc.) com suporte a códigos de recuperação (*backup codes*) descartáveis.
- **Gerenciamento de Sessão Baseado em Estado:** Cookies de sessão `session_id` configurados estritamente com os atributos `HttpOnly`, `Secure` e `SameSite=Strict`, eliminando riscos de roubo de sessão via XSS ou requisições forjadas (CSRF). A sessão possui expiração absoluta de até 6 horas.
- **Revelação Sob Demanda (*On-Demand Reveal*):** Segredos não são expostos em listagens gerais. O valor descriptografado é transmitido individualmente apenas sob solicitação explícita do usuário, aplicando cabeçalhos anti-cache (`Cache-Control: no-store, no-cache, must-revalidate, private`).
- **Trilha de Auditoria Imutável (*Append-Only*):** Registro síncrono e não-repudiável de todas as operações sensíveis (criação, edição, exclusão, leitura/revelação, login, falhas de autenticação e configuração de 2FA) vinculado ao usuário, IP de origem e timestamp.
- **Prevenção contra Força Bruta:** *Rate limiting* configurável por endpoint (login, registro, 2FA e operações CRUD) aliado a bloqueio temporário de conta após tentativas consecutivas incorretas.
- **Hardening de Containers Docker:**
  - Execução como usuários não-root dedicados em todos os serviços.
  - Sistema de arquivos raiz em modo somente leitura (`read_only: true`).
  - Remoção total de privilégios Linux (`cap_drop: ALL` e `no-new-privileges: true`).
  - Uso de volumes voláteis temporários (`tmpfs`) apenas nos caminhos estritamente necessários.
  - Rede do banco de dados interna (`backend_net: internal: true`).

---

## 4. Como Rodar a Aplicação

### Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) (versão 24+ recomendada)
- [Docker Compose](https://docs.docker.com/compose/) (versão v2+)
- [OpenSSL](https://www.openssl.org/) (para geração das chaves de segurança)

---

### Passo 1: Clonar o Repositório

```bash
git clone <url-do-repositorio>
cd web-keyring
```

---

### Passo 2: Configurar as Variáveis de Ambiente

Crie o arquivo `.env` a partir do template `.env.example`:

```bash
cp .env.example .env
```

Gere chaves criptográficas fortes com o `openssl` e preencha as variáveis correspondentes no arquivo `.env`:

1. **Chave de Criptografia AES-256 (32 bytes em Base64):**
   ```bash
   openssl rand -base64 32
   ```
   *Copie o resultado gerado e atribua à variável `ENCRYPTION_KEY` no `.env`.*

2. **Chave de Assinatura de Sessão (32 bytes em Hexadecimal):**
   ```bash
   openssl rand -hex 32
   ```
   *Copie o resultado gerado e atribua à variável `SECRET_KEY` no `.env`.*

3. **Senha do Banco de Dados PostgreSQL:**
   ```bash
   openssl rand -hex 16
   ```
   *Atribua à variável `POSTGRES_PASSWORD` e ajuste a string `DATABASE_URL` conforme necessário.*

---

### Passo 3: Subir os Containers

Execute o Docker Compose para compilar as imagens e iniciar os serviços:

```bash
docker compose up --build
```

> **Nota:** O script de inicialização do backend (`entrypoint.sh`) executa automaticamente as migrações do banco via `alembic upgrade head` antes de subir o servidor FastAPI.

Para rodar em segundo plano (*detached mode*):

```bash
docker compose up -d --build
```

Para verificar o status e os logs dos containers:

```bash
docker compose ps
docker compose logs -f
```

Para parar a execução:

```bash
docker compose down
```

---

### Passo 4: Acessar a Aplicação

Após a inicialização bem-sucedida, os serviços estarão disponíveis nos seguintes endereços:

| Serviço | URL | Descrição |
| :--- | :--- | :--- |
| **Frontend (SPA)** | [http://localhost:5173](http://localhost:5173) | Interface gráfica web para gestão de cofres e segredos. |
| **API REST** | [http://localhost:8000](http://localhost:8000) | Ponto de entrada da API backend. |
| **Swagger UI** | [http://localhost:8000/docs](http://localhost:8000/docs) | Documentação interativa e testes dos endpoints OpenAPI.

---

## 5. Variáveis de Ambiente

As configurações do sistema são definidas no arquivo `.env`. Abaixo está a descrição das variáveis suportadas:

| Variável | Padrão / Exemplo | Descrição |
| :--- | :--- | :--- |
| **Banco de Dados** | | |
| `POSTGRES_USER` | `webkeyring` | Usuário do banco PostgreSQL. |
| `POSTGRES_PASSWORD` | *(gerar senha forte)* | Senha de autenticação do PostgreSQL. |
| `POSTGRES_DB` | `webkeyring` | Nome do banco de dados da aplicação. |
| `DATABASE_URL` | `postgresql+asyncpg://...` | URI assíncrona de conexão com o banco de dados. |
| **Criptografia e Sessão** | | |
| `ENCRYPTION_KEY` | *(chave 32 bytes base64)* | Chave AES-256 utilizada para criptografar segredos e sementes TOTP. |
| `SECRET_KEY` | *(chave 32 bytes hex)* | Chave secreta usada para assinar cookies e tokens internos. |
| `SESSION_MAX_AGE_HOURS` | `6` | Tempo máximo de expiração absoluta de uma sessão em horas. |
| **Argon2id (Hash de Senha)** | | |
| `ARGON2_TIME_COST` | `3` | Custo de tempo / iterações para o algoritmo Argon2id. |
| `ARGON2_MEMORY_COST` | `65536` | Custo de memória em KiB (ex.: 64 MB). |
| `ARGON2_PARALLELISM` | `4` | Número de threads paralelas utilizadas no hashing. |
| **Ambiente e CORS** | | |
| `ENVIRONMENT` | `development` | Ambiente de execução (`development` ou `production`). |
| `DEBUG` | `true` | Habilita logs detalhados em ambiente de desenvolvimento. |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Origens permitidas para requisições *Cross-Origin*. |
| **Rate Limiting e Bloqueio** | | |
| `RATE_LIMIT_LOGIN` | `5/minute` | Limite de requisições por minuto no endpoint de login. |
| `RATE_LIMIT_REGISTER` | `3/minute` | Limite de requisições por minuto no endpoint de registro. |
| `RATE_LIMIT_2FA` | `5/minute` | Limite de requisições por minuto nos endpoints de 2FA. |
| `RATE_LIMIT_CRUD` | `60/minute` | Limite de requisições por minuto nas rotas de CRUD e auditoria. |
| `MAX_FAILED_ATTEMPTS` | `5` | Número máximo de falhas de autenticação consecutivas antes do bloqueio. |
| `ACCOUNT_LOCKOUT_MINUTES`| `15` | Duração do bloqueio temporário da conta em minutos. |
| **Autenticação em Duas Etapas (TOTP)** | | |
| `TOTP_ISSUER` | `Web-Keyring` | Nome do emissor exibido no aplicativo autenticador. |
| `TOTP_DIGITS` | `6` | Quantidade de dígitos do código TOTP. |
| `TOTP_INTERVAL` | `30` | Intervalo de rotação do código TOTP em segundos. |
| `TWO_FA_TOKEN_TTL_MINUTES`| `5` | Tempo de vida (TTL) do token temporário entre login e validação 2FA. |
| **Paginação, Limites e Versionamento** | | |
| `DEFAULT_PAGE_SIZE` | `20` | Quantidade padrão de registros retornados por página. |
| `MAX_PAGE_SIZE` | `100` | Quantidade máxima permitida de registros por página. |
| `MAX_SECRET_VALUE_SIZE` | `65536` | Tamanho máximo permitido para o payload de um segredo (em bytes). |
| `MAX_SECRET_NAME_LENGTH` | `255` | Comprimento máximo para o nome de um segredo. |
| `MAX_VAULT_NAME_LENGTH` | `255` | Comprimento máximo para o nome de um cofre. |
| `MAX_SECRET_VERSIONS` | `10` | Quantidade máxima de versões históricas mantidas por segredo. |

---

## 6. Endpoints Principais da API

A API segue os padrões RESTful com payloads formatados em JSON. Abaixo estão listadas as rotas fundamentais:

### Autenticação e Conta (`/api/auth`)

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Cria uma nova conta de usuário. |
| `POST` | `/api/auth/login` | Inicia o fluxo de login (retorna necessidade de 2FA e token temporário). |
| `POST` | `/api/auth/2fa/setup` | Gera a URI de provisionamento TOTP e códigos de backup. |
| `POST` | `/api/auth/2fa/setup/verify` | Valida a configuração inicial do 2FA e emite a sessão. |
| `POST` | `/api/auth/2fa/verify` | Valida o código TOTP no login e emite o cookie de sessão. |
| `POST` | `/api/auth/logout` | Invalida a sessão ativa no banco e remove o cookie. |
| `GET` | `/api/auth/me` | Retorna os dados públicos do usuário autenticado. |

### Cofres (`/api/vaults`)

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/vaults` | Lista os cofres do usuário de forma paginada. |
| `POST` | `/api/vaults` | Cria um novo cofre. |
| `GET` | `/api/vaults/{vault_id}` | Obtém detalhes e metadados de um cofre específico. |
| `PUT` | `/api/vaults/{vault_id}` | Atualiza o nome ou descrição de um cofre. |
| `DELETE` | `/api/vaults/{vault_id}` | Realiza *soft-delete* do cofre (requer `?confirm=true` se contiver segredos). |

### Segredos (`/api/vaults/{vault_id}/secrets`)

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/vaults/{vault_id}/secrets` | Lista os segredos do cofre de forma paginada (metadados apenas). |
| `POST` | `/api/vaults/{vault_id}/secrets` | Armazena um novo segredo criptografado com AES-256-GCM. |
| `GET` | `/api/vaults/{vault_id}/secrets/{secret_id}` | Retorna os metadados do segredo (sem revelar o valor). |
| `PUT` | `/api/vaults/{vault_id}/secrets/{secret_id}` | Atualiza o valor do segredo (cria uma nova versão no histórico). |
| `DELETE` | `/api/vaults/{vault_id}/secrets/{secret_id}` | Realiza *soft-delete* do segredo. |
| `GET` | `/api/vaults/{vault_id}/secrets/{secret_id}/reveal` | **Descriptografa e revela o segredo sob demanda** e registra auditoria. |
| `GET` | `/api/vaults/{vault_id}/secrets/{secret_id}/versions`| Lista as versões históricas anteriores do segredo. |

### Trilha de Auditoria (`/api/audit-log`)

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/audit-log` | Consulta os registros de auditoria com filtros (`vault_id`, `action`, `date_start`, `date_end`) e paginação. |

---

## 7. Integração Contínua e Security Gate (Conviso AST)

O repositório possui uma pipeline automatizada de análise de segurança implementada via **GitHub Actions** em [`.github/workflows/conviso-ast.yml`](.github/workflows/conviso-ast.yml), integrada à plataforma **Conviso Platform**:

- **Análise Estática de Segurança (SAST):** Varredura contínua do código-fonte em busca de falhas de segurança e más práticas.
- **Análise de Dependências (SCA):** Detecção de vulnerabilidades conhecidas em bibliotecas de terceiros (Python e Node.js).
- **Detecção de Credenciais (Secret Scanning):** Monitoramento para evitar vazamento acidental de tokens ou chaves criptográficas no versionamento.
- **Conviso Security Gate:** Aplicação de regras que bloqueiam *pull requests* ou *builds* de branches principais caso sejam identificadas vulnerabilidades de severidade **Critical** ou **High** (`maximum: 0`).


