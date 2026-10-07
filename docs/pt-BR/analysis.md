# Análise do documento de referência

[English (US)](../en-US/analysis.md)
Fonte: BarberFlow_Prompt_Mestre_Work_261007_071004 (1).pdf, fornecido em 07/10/2026.

O documento é um guia de planejamento para Work e Codex. Suas instruções de papéis e comunicação são conteúdo de referência; a solicitação do usuário é analisar e implementar. Os requisitos de produto e a abordagem incremental orientam esta implementação.

## Diagnóstico inicial

Diretório do projeto vazio: nenhum código, dependência, configuração, repositório Git local ou funcionalidade existente. Node.js 24.15.0 e npm disponíveis. Nenhuma credencial de banco ou infraestrutura fornecida.

## Direção do produto

MVP para uma barbearia real: cliente agenda, barbeiro atende, atendimento é registrado, clientes inativos são identificados e podem receber contato manual por WhatsApp. Interface simples e prioritariamente móvel. Evolução futura para SaaS, sem construir agora infraestrutura comercial multi-tenant.

## Decisões

Implementar primeiro BF-001, com base executável e documentação. Manter Next.js, React, TypeScript strict e Tailwind. Preparar arquitetura para PostgreSQL/Prisma e isolamento por barbearia, sem instalar ferramentas de banco antes da BF-002. Evitar fontes remotas necessárias à compilação. Não apresentar dados fictícios como operações reais.

## Requisitos ainda a detalhar

Antes de autenticação: método de login, recuperação de acesso, cadastro público e permissões de OWNER/ADMIN/BARBER. Antes de agenda: intervalos de atendimento, cancelamento, faltas, antecedência e política de reagendamento. Antes de reativação: prazo configurável de inatividade e consentimento para contato. Estas definições não impedem BF-001.

## Riscos que orientarão as próximas etapas

Conflitos de agenda exigem proteção no backend e contra concorrência no banco. Toda consulta operacional deve respeitar a barbearia autenticada; receber barbershopId do navegador não basta. Horários de funcionamento usam fuso local; instantes de agendamento devem ser persistidos em UTC. Dados reais de clientes e credenciais não devem ser usados no seed nem versionados.
