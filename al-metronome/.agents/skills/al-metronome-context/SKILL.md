---
name: AL Metronome
description: Fornece contexto detalhado e diretrizes para o projeto FretDraw v2.1+, incluindo preferências do desenvolvedor, descrição do produto, stack tecnológico e regras de arquitetura core.
---

# Contexto de Projeto: AL Metronome

## 1. O Desenvolvedor (O Tech Lead)

- **Nome:** Alexandre. Pai da Sofia e estudante de programação e música (guitarrista).
- **Tom de Comunicação Exigido:** Formal, corporativo, altamente prático e direto ao ponto. Use jargões de engenharia de software e metodologias ágeis. Um toque de humor sagaz é bem-vindo quando apropriado.
- **Padrão de Código:** Código limpo, componentizado e blindado. É estritamente proibido o uso de `any` no TypeScript. Respeite as tipagens de domínio.

## 2. O Produto (FretDraw)

- **Descrição:** Uma "Workstation" interativa de estudo de música, desenhada para visualizar escalas, arpejos (CAGED e três notas por corda) e treinar memória muscular e percepção rítmica.
- **Tech Stack:** React (Frontend v19+), Electron (Desktop v39+), Vite (Bundler), Tailwind CSS (Estilização), Tone.js (Motor de Áudio v15+), Tonal.js (Motor Teórico de Harmonias).

## 3. Arquitetura Core e Regras de Negócio

### 3.1 Visão Executiva

O AL Metronome é uma aplicação de desktop de alta performance focada na precisão rítmica e no treino automatizado para músicos. Projetado para contornar as limitações de latência das threads visuais, o sistema separa rigorosamente a interface gráfica do motor de áudio, garantindo um SLA de entrega de milissegundos matematicamente perfeitos.

### 3.2 Stack Tecnológica Base

Core Wrapper: Electron (Empacotado via electron-builder para MS Store AppX).

Frontend UI: React + Vite.

Linguagem: TypeScript (Tipagem estrita para prevenção de runtime errors).

Audio Engine: Tone.js (Web Audio API abstraction).

Styling: CSS Nativo + Lucide React (Ícones vetoriais).

### 3.3 Arquitetura Core (Design em Camadas)

A arquitetura do AL Metronome é baseada na separação de responsabilidades (Separation of Concerns), dividida em três pilares fundamentais:

#### 3.3.1 Camada de Contratos (Single Source of Truth)

Centralizada no ficheiro metronome.types.ts, esta camada define as estruturas de dados. Nenhum componente ou motor "adivinha" formatos; todos assinam os contratos aqui definidos.

TimeSignature: Define a assinatura rítmica (numerator para quantidade de tempos, denominator para a unidade de nota).

BeatStep: Matriz visual de tempos (Índice e Tipo: ACCENT, NORMAL, MUTE).

SoundType: Catálogo de timbres (DIGITAL, MECHANICAL, BEEP).

#### 3.3.2. Camada de UI e Gestão de Estado (App.tsx)

Atua como o orquestrador visual.

Gestão de Estado: Utiliza Hooks (useState, useEffect, useRef) para gerir o estado da UI sem bloquear a thread de áudio.

Lazy Initialization & Cache: O estado global (Compasso, Volume, Timbre, Tema) é hidratado via localStorage no momento da montagem (montagem do componente) para garantir uma UX sem atrito (persistência de sessão).

Reatividade Condicional: O visualizador de tempos (BeatDisplay) é destruído e recriado dinamicamente sempre que a fórmula de compasso é alterada, garantindo total conformidade visual com o motor.

#### 3.3.3 Camada de Áudio (Core Engine)

O MetronomeEngine.ts é o coração da aplicação.

Tone.Transport: Em vez de usar a função nativa setInterval do JavaScript (que sofre gargalos de performance ligados à renderização do DOM), o motor delega o agendamento rítmico para a API Web Audio nativa do navegador via Tone.js.

Isolamento de Estado: O motor mantém a sua própria cópia validada do compasso, passos e BPM, evitando problemas de sincronia (race conditions) caso a UI sofra atrasos na renderização.

## 4. Regras de Negócio (Business Logic)

### 4.1. Matemática de Compasso e Agendamento

O sistema não está engessado em métricas de semínimas (4/4). O agendamento de áudio é calculado de forma dinâmica: o denominator define a string de intervalo nativa do Tone.js (ex: 4n para semínimas, 8n para colcheias).

O tempo 1 (índice 0) é sempre renderizado por defeito como ACCENT (nota C5 ou D4 no MembraneSynth), servindo como âncora rítmica do compasso.

### 4.2. Módulos de Treino (Trainers)

A aplicação possui três instâncias operacionais (AppMode):

Free Mode (Operação Padrão):

Metrónomo contínuo, alteração manual de BPM.

Speed Trainer (SLA de Velocidade):

Regra: O utilizador define um BPM inicial, um BPM alvo, a taxa de incremento e o intervalo (quantidade de compassos).

Comportamento: O sistema aumenta automaticamente o BPM a cada X compassos lidos até atingir o alvo (BPM teto), congelando a velocidade ao atingir o limite.

Time Trainer (SLA de Resistência):

Regra: O utilizador define um alvo em minutos.

Comportamento: O motor calcula a conversão de ticks e encerra a reprodução automaticamente (fullStop) assim que o SLA de tempo é atingido, disparando um callback de notificação visual.

### 4.3. Regra de Entrada (Count-in Phase)

Nos modos de Treino, se a opção de Count-in estiver ativa, o sistema injeta "1 compasso virtual" (barsCountedRef.current) apenas com um clique audível antes de iniciar a contagem dos dados do treino propriamente dito, permitindo que o músico se posicione.

## 5. Pipeline de Build e Deploy (Microsoft Store)

O ciclo de vida de release do AL Metronome segue um protocolo estrito de empacotamento para garantir 100% de compliance com as exigências de certificação da plataforma UWP/AppX da Microsoft (Partner Center).

### 5.1. Governança de Versionamento (Version Bump)

O motor de ingestion da Microsoft Store rejeita sumariamente pacotes com numeração duplicada. Antes de gerar um novo binário, a governança de código exige o incremento semântico no terminal:

npm version patch: Utilizado para hotfixes e correções de bugs menores (ex: 1.1.5 para 1.1.6).

npm version minor: Utilizado no lançamento de novas features (ex: adição de bússolas irregulares).

### 5.2. Scripts de Compilação (CLI)

A esteira de build orquestra a validação estática (TypeScript), o bundle do Vite e o empacotamento final pelo electron-builder.

npm run typecheck: Executa a auditoria estática do TypeScript no Node e no Web, abortando a esteira caso haja quebra de contrato nos tipos.

npm run build:win: O gatilho principal de produção. Compila todo o código-fonte e gera o artefato final e assinado (.appx) direcionado exclusivamente para a arquitetura do Windows SDK.

### 5.3. Estratégia de Injeção Visual Corporativa (AppX Bypass)

Para contornar falhas silenciosas (silent fails) e o comportamento opinativo do electron-builder ao gerar tiles do Windows, o AL Metronome adota uma arquitetura de injeção estática de assets:

O sistema não confia na geração dinâmica a partir de um único icon.png.

O diretório build/appx/ armazena as matrizes visuais pré-renderizadas nas dimensões exatas exigidas pelas políticas da Microsoft (StoreLogo.png, Square44x44Logo.png, Square150x150Logo.png, Wide310x150Logo.png).

Ao identificar este diretório, o empacotador anula o seu auto-gerador e consome os assets diretos, blindando a UI contra distorções e garantindo a aprovação imediata no Tier 1 de auditoria da loja.
