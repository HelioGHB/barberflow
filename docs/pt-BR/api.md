# API

[English (US)](../en-US/api.md)
Nenhum endpoint de negócio implementado até a BF-002. `/` entrega a apresentação do produto. Não existem login, CRUD, disponibilidade ou reservas.

Route Handlers serão adicionados por funcionalidade, com validação Zod, autorização no servidor e contexto de barbearia derivado da sessão. Cada implementação documentará método, caminho, entrada, saída, permissões e erros reais. Conflitos de reserva devem resultar em resposta 409.

Não há contrato de API público definitivo nesta etapa.

O diagnóstico de banco é um comando local (`npm run db:check`), não um endpoint público.
