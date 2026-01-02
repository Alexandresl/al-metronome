# 🎵 AL Metronome v1.0.0

**Data de Lançamento:** 02/01/2026
**Versão:** 1.0.0 (Initial Release)

Temos o prazer de anunciar a primeira versão oficial do **AL Metronome**. Esta aplicação desktop foi desenvolvida para oferecer precisão milimétrica e ferramentas avançadas de treino para músicos, combinando uma interface moderna com um motor de áudio robusto.

## 🚀 Principais Funcionalidades

### 🧠 Speed Trainer (Modo de Treino Inteligente)

Automatize seus estudos de velocidade sem tirar as mãos do instrumento.

-   **Incremento Automático:** Configure o BPM inicial, final, o passo de incremento (ex: +5 bpm) e o intervalo de compassos.
-   **Feedback Visual:** Barra de progresso dedicada que indica exatamente quando a velocidade irá subir.
-   **Modo Cruzeiro:** Ao atingir o BPM alvo, o metrônomo mantém a velocidade máxima indefinidamente para resistência.
-   **Proteção de Usabilidade:** Interface otimizada que oculta configurações complexas durante a execução para foco total.

### 🎛️ Motor de Áudio & Personalização

-   **Precisão de Studio:** Construído sobre o `Tone.js`, garantindo tempo perfeito sem flutuações, independente da carga do sistema.
-   **Timbre Selecionável:** Escolha entre 3 tipos de som para cortar qualquer mix:
    -   _Digital_ (Sine Wave limpa)
    -   _Mecânico_ (Woodblock clássico)
    -   _Beep_ (Alta frequência)
-   **Controle de Volume:** Ajuste logarítmico independente do volume do sistema.

### 🎨 Interface & Experiência (UX)

-   **Visual Beat Display:** Indicadores visuais de batida (Acento/Normal) que facilitam a leitura do compasso "no olho".
-   **Temas Claro/Escuro:** Suporte nativo a Dark Mode para conforto visual em ambientes de estúdio ou palco.
-   **Design Responsivo:** Layout fluido que se adapta sem criar barras de rolagem desnecessárias.

---

## 🛠️ Stack Tecnológica

Este projeto foi construído utilizando tecnologias modernas de desenvolvimento desktop:

-   **Core:** Electron + React (Vite)
-   **Linguagem:** TypeScript (Strict Mode)
-   **Áudio:** Tone.js (Web Audio API Wrapper)
-   **Estilização:** CSS Variables (Theming Engine)
-   **Build:** Electron Builder (NSIS Installer para Windows)

---

## 📦 Instalação (Windows)

1. Baixe o arquivo `AL Metronome Setup 1.0.0.exe` nos Assets abaixo.
2. Execute o instalador
