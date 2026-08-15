# Política de Segurança da Aplicação

**Projeto:** Web-Keyring (Gerenciador de Senhas Web)   
**Controle de versão:** 1.0   
**Data:** 15 Agosto de 2026   

---

## 1. Objetivo

Esta política estabelece as diretrizes básicas de segurança da informação e desenvolvimento seguro que deverão ser seguidas durante a construção, implantação e manutenção da aplicação de gerenciamento de senhas online.

O objetivo é reduzir riscos de segurança, proteger os dados e secrets armazenados pela aplicação e garantir que controles de segurança sejam considerados durante todo o ciclo de vida de desenvolvimento.

Por se tratar de uma aplicação destinada ao armazenamento de credenciais, tokens, chaves e demais informações sensíveis, o Web-Keyring deverá adotar o princípio de segurança por padrão, de modo que os mecanismos de proteção sejam considerados desde a concepção da aplicação e não somente após sua implementação.

---

## 2. Escopo

A aplicação consiste em um gerenciador web de segredos (tokens de API, credenciais de banco, chaves SSH) para uso interno de equipes de dev/infra, com o fim de guardar, buscar, visualizar e auditar o acesso a esses segredos, facilitando assim o dia-a-dia das equipes.

A presente política se aplica a todas as frentes utilizadas na aplicação, sendo elas o front-end, back-end/API, banco de dados e camada de persistência, infraestrutura de aplicação, serviços auxiliares, mecanismos de autenticação, criptografia e qualquer futura integração na pipeline.

Toda e qualquer pessoa (bem como agentes ou modelos de linguagem) que escreva e revise código para este projeto estará automaticamente sujeita às diretrizes aqui estabelecidas, independente do meio utilizado.  

Toda alteração feita deve ser atribuída ao autor e, com isso, este torna-se responsável por ela.

---

## 3. Princípios de Segurança

**3.1** O princípio do menor privilégio deverá ser aplicado a usuários, componentes da aplicação, serviços e integrações.
**3.2** Todo acesso deverá ser negado por padrão, sendo permitido somente quando explicitamente autorizado.
**3.3** Dados sensíveis deverão ser coletados, processados e armazenados somente quando necessários para o funcionamento da aplicação.
**3.4** Nenhum componente da aplicação deverá possuir acesso aos secrets além do estritamente necessário para o desempenho de sua função.
**3.5** Controles de segurança deverão ser implementados desde a concepção da funcionalidade, não sendo tratados como etapa posterior ao desenvolvimento.
**3.6** A aplicação deverá considerar como cenário de ameaça o comprometimento de componentes individuais, incluindo banco de dados, servidor de aplicação, credenciais de acesso e contas de usuários.

---

## 4. Diretrizes de Autenticação e Autorização

Levando em consideração que a própria aplicação já trata do gerenciamento de secrets, é imprescindível que haja uma política de controle rígida quanto à autenticação e autorização.

No caso do Web-Keyring, o usuário final terá uma senha-mestra que cumpra determinados requisitos listados a seguir:

**4.1** Mínimo de 12 caracteres, sendo recomendável a utilização de senhas ou passphrases ainda maiores;
**4.2** Não deve conter trechos facilmente identificáveis do nome de usuário ou outras informações públicas do usuário;
**4.3** Não deve corresponder a senhas previamente comprometidas, comuns ou presentes em listas conhecidas de senhas;
**4.4** O usuário deve cadastrar, obrigatoriamente, um segundo fator de autenticação;
**4.5** Deverá existir limitação de tentativas de autenticação, com mecanismos de rate limiting e bloqueio temporário após sucessivas tentativas inválidas;
**4.6** Em caso de múltiplos erros de autenticação, a conta poderá ser temporariamente bloqueada, devendo seu desbloqueio seguir mecanismo seguro de recuperação e autenticação multifator;
**4.7** Alterações da senha-mestra, MFA ou demais mecanismos críticos de autenticação deverão invalidar sessões consideradas comprometidas ou não confiáveis;
**4.8** As decisões de autorização deverão ser realizadas no lado do servidor, não sendo permitido confiar em informações fornecidas pelo cliente para determinar privilégios de acesso.

---

## 5. Proteção de Dados e Criptografia

**5.1** A senha utilizada para autenticação do usuário jamais será armazenada em texto-puro, devendo ser protegida por função de hash adaptativa e resistente a ataques de força bruta, preferencialmente Argon2id.
**5.2** Os secrets armazenados pelo Web-Keyring não deverão ser armazenados em texto-puro, devendo permanecer criptografados em repouso.
**5.3** Diferentemente das senhas utilizadas para autenticação, os secrets armazenados deverão ser criptografados e não simplesmente submetidos a funções de hash, uma vez que precisam ser recuperados em seu formato original pelo usuário autorizado.
**5.4** Sempre que tecnicamente possível, a criptografia e descriptografia dos secrets deverá ocorrer no lado do cliente, de modo que o servidor não possua acesso aos secrets em texto-puro.
**5.5** A senha-mestra não deverá ser armazenada ou transmitida ao servidor em texto-puro.
**5.6** As chaves criptográficas deverão ser geradas utilizando mecanismos criptograficamente seguros e deverão possuir ciclo de vida próprio, incluindo geração, armazenamento, utilização, rotação, revogação e destruição.
**5.7** Não deverão ser utilizados algoritmos criptográficos proprietários, obsoletos ou desenvolvidos especificamente para a aplicação quando existirem alternativas consolidadas e amplamente avaliadas pela comunidade de segurança.
**5.8** Todas as comunicações entre cliente, API e demais componentes da aplicação deverão utilizar HTTPS/TLS.
**5.9** Secrets descriptografados deverão permanecer em memória pelo menor tempo possível e não deverão ser armazenados em mecanismos de persistência do navegador, como `localStorage`, salvo mediante justificativa técnica e controle de segurança específico.
**5.10** Não deverá existir qualquer mecanismo que permita aos desenvolvedores visualizar os secrets dos usuários sem autorização explícita e devidamente registrada.

---

## 6. Gerenciamento de Sessões

**6.1** A autenticação será realizada do lado do servidor, por meio de cookies de sessão.
**6.2** Os cookies de sessão deverão utilizar, obrigatoriamente, os atributos `HttpOnly`, `Secure` e `SameSite`, conforme a necessidade da aplicação.
**6.3** Os identificadores de sessão não deverão ser armazenados em `localStorage` ou `sessionStorage`.
**6.4** A aplicação deverá implementar expiração absoluta e expiração por inatividade das sessões.
**6.5** O prazo máximo de uma sessão deverá ser de 6 horas, podendo ser inferior conforme o nível de sensibilidade da operação realizada.
**6.6** Operações consideradas críticas, como visualização, exportação ou compartilhamento de secrets, poderão exigir nova autenticação ou confirmação da senha-mestra.
**6.7** O identificador da sessão deverá ser renovado após eventos relevantes de autenticação ou elevação de privilégio.
**6.8** O encerramento da sessão deverá invalidar o identificador correspondente no servidor.
**6.9** A aplicação deverá utilizar cabeçalhos de segurança adequados, incluindo mecanismos para impedir o armazenamento em cache de páginas e respostas que contenham secrets ou informações sensíveis.

---

## 7. Controle de Acesso

**7.1** Cada secret deverá possuir um proprietário ou grupo responsável claramente definido.
**7.2** O acesso aos secrets deverá obedecer ao princípio do menor privilégio.
**7.3** Usuários não poderão acessar, modificar, excluir ou compartilhar secrets aos quais não possuam autorização explícita.
**7.4** O controle de acesso deverá ser validado no servidor para toda operação sensível.
**7.5** A alteração de privilégios de acesso deverá gerar registro de auditoria.
**7.6** O sistema deverá impedir que um usuário manipule identificadores ou parâmetros da requisição para acessar secrets pertencentes a outro usuário ou grupo.
**7.7** Contas administrativas não deverão possuir acesso irrestrito aos secrets armazenados, salvo quando houver necessidade operacional previamente definida e devidamente registrada.

---

## 8. Auditoria e Registro de Eventos

**8.1** Toda operação sensível realizada pelo usuário deverá gerar um log de auditoria, consultável dentro do próprio sistema.
**8.2** Os registros deverão identificar, sempre que aplicável, o usuário responsável, operação realizada, recurso afetado, data e hora, resultado da operação e origem da requisição.
**8.3** Os logs de auditoria deverão possuir mecanismos que impeçam ou detectem sua alteração e exclusão não autorizadas.
**8.4** O acesso aos próprios logs de auditoria também deverá ser controlado e registrado.
**8.5** Secrets, senhas, tokens, chaves criptográficas, identificadores de sessão e demais informações sensíveis jamais deverão ser registrados em texto-puro nos logs.
**8.6** Deverão ser registrados, entre outros eventos:
**-8.6.1** Autenticações bem-sucedidas e malsucedidas;
**-8.6.2** Alterações de senha-mestra;
**-8.6.3** Alterações de MFA;
**-8.6.4** Criação, alteração e exclusão de secrets;
**-8.6.5** Visualização ou cópia de secrets;
**-8.6.6** Compartilhamento e revogação de acesso;
**-8.6.7** Alterações de configurações de segurança;
**-8.6.8** Eventos de bloqueio e desbloqueio de contas.
**8.7** Os logs deverão possuir política de retenção definida, considerando requisitos operacionais, legais e de segurança.

---

## 9. Práticas de Desenvolvimento Seguro

**9.1** Sob nenhuma circunstância, senhas, tokens, chaves ou secrets deverão estar hardcoded no código-fonte.
**9.2** Todo pull-request deverá passar por uma revisão adjacente dos pares envolvidos no desenvolvimento.
**9.3** Todo código deverá ser submetido a mecanismos automatizados de análise de segurança sempre que tecnicamente aplicável, incluindo SAST, SCA e secret scanning.
**9.4** Dependências utilizadas pela aplicação deverão ser mantidas atualizadas e monitoradas quanto à existência de vulnerabilidades conhecidas.
**9.5** Após toda modificação majoritária no projeto, deverá ser realizado um scan de vulnerabilidades, documentado na Conviso Platform.
**9.6** Vulnerabilidades identificadas deverão possuir tratamento documentado, contendo ao menos sua classificação, responsável, prazo para correção e situação atual.
**9.7** Não deverá ser realizado deploy de alterações que contenham vulnerabilidades críticas conhecidas sem uma justificativa formal e aprovação do responsável pelo projeto.
**9.8** Dados de produção não deverão ser utilizados em ambientes de desenvolvimento ou testes sem a aplicação dos controles necessários de anonimização ou proteção.
**9.9** O código deverá ser desenvolvido considerando as principais vulnerabilidades de aplicações web segundo o OWASP Top 10.

---

## 10. Infraestrutura e Configuração

**10.1** Credenciais utilizadas pela infraestrutura deverão ser armazenadas em mecanismos próprios de gerenciamento de secrets, não sendo permitida sua inclusão em arquivos de configuração versionados.
**10.2** Ambientes de desenvolvimento, homologação e produção deverão possuir separação adequada.
**10.3** Os serviços utilizados pela aplicação deverão operar com o menor nível de privilégio possível.
**10.4** Sistemas operacionais, bibliotecas, frameworks, bancos de dados e demais componentes deverão permanecer atualizados dentro de ciclos de manutenção definidos, sendo mantida sempre a versão com menos vulnerabilidades identificadas pelo SCA.

---

## 11. Gestão de Incidentes

**11.1** Todo incidente que possa comprometer a confidencialidade, integridade ou disponibilidade da aplicação deverá ser registrado e tratado conforme procedimento definido de resposta a incidentes.
**11.2** Em caso de comprometimento de uma credencial, secret ou chave criptográfica, deverá existir mecanismo para sua revogação e substituição.
**11.3** Em caso de comprometimento de sessão, a sessão afetada deverá ser invalidada.
**11.4** Em caso de suspeita de comprometimento da infraestrutura, deverá ser realizada análise dos logs e demais evidências disponíveis.
**11.5** Incidentes envolvendo dados pessoais deverão ser avaliados quanto às obrigações previstas na legislação aplicável.
**11.6** Os procedimentos de resposta a incidentes deverão ser testados periodicamente.

---

## 12. Conformidade e Privacidade

**12.1** O tratamento de dados pessoais realizado pela aplicação deverá observar a legislação aplicável, especialmente a Lei Geral de Proteção de Dados Pessoais (LGPD).
**12.2** As medidas de segurança deverão ser consideradas desde a fase de concepção da aplicação até sua execução e manutenção.
**12.3** A aplicação deverá limitar a coleta e retenção de dados pessoais ao mínimo necessário para seu funcionamento.
**12.4** O acesso a dados pessoais deverá ser restrito aos usuários e componentes que possuam necessidade legítima de acesso.
**12.5** As informações pessoais presentes nos logs deverão ser minimizadas, mascaradas ou pseudonimizadas sempre que sua identificação não for necessária para a finalidade do registro.

---

## 13. Revisão da Política

**13.1** Esta política deverá ser revisada periodicamente ou sempre que houver alteração relevante na arquitetura, nas funcionalidades ou no modelo de ameaça da aplicação.
**13.2** Alterações nesta política deverão possuir controle de versão e autoria identificada.
**13.3** Novas funcionalidades que envolvam autenticação, autorização, criptografia, compartilhamento ou processamento de secrets deverão ser avaliadas quanto ao impacto de segurança antes de sua implementação em produção.

