# ☕ Café Pra Viagem | Documentação de Produto e Arquitetura

**Domínio:** cafepraviagem.com  
**Nicho:** Equipamentos portáteis, táticas de extração e cafeterias *takeaway* para consumo em deslocamento.  
**Modelo de Negócio:** Curadoria editorial monetizada via AdSense (densidade moderada) e links de afiliados (*cross-selling*).

---

## 📌 Visão do Produto
O **Café Pra Viagem** resolve pontos ocultos de exclusão no ecossistema do café especial. Projetado para quem opera sob restrição de tempo e mobilidade, o portal atua como um hub curatorial que filtra equipamentos e rotas baseando-se em uso real: resistência a impacto, retenção térmica e tolerância a erros de extração. O design prioriza a utilidade prática em detrimento da estética puramente contemplativa.

---

## 🏗️ Arquitetura Técnica e Governança

O portal opera como um Gerador de Sites Estáticos (SSG) executado inteiramente no lado do cliente (Client-Side Rendering), hospedado via GitHub Pages/Cloudflare. 

### 1. Acessibilidade Estrutural (A11y)
A acessibilidade neste projeto é estrutural, não um anexo estético.
*   **HTML Semântico & Foco:** Marcação rigorosa com landmarks (`<main>`, `<nav>`, `<header>`, `<footer>`). Gerenciamento de foco nativo para navegação via teclado e modais interativos (`aria-hidden`, `aria-modal`).
*   **Prevenção de Fadiga Cognitiva:** Sistema de design parametrizado para contraste WCAG AA/AAA. Controles de ampliação tipográfica (A-/A+) e alternância de tema (Light/Dark) com memorização no `localStorage`.
*   **Camada de Tradução:** Integração do widget VLibras embutido globalmente. *Nota de Governança:* O VLibras atua como localização, não substituindo a obrigação do uso de `aria-labels` e hierarquia de cabeçalhos.

### 2. Gestão de Dados (Headless JS)
*   **Desacoplamento Rigoroso:** Nenhum conteúdo editorial está hardcoded no HTML. O motor JavaScript realiza o *fetch* assíncrono simultâneo (via `Promise.all`) de dois arquivos JSON:
    *   `dados.json`: Diretório principal de curadoria.
    *   `parceiros.json`: Rede de *cross-linking* para portais aliados e links de afiliados.
*   **Degradação Elegante:** Se a requisição de parceiros falhar, o DOM recolhe a seção sem quebrar a interface principal.

### 3. Monetização e Rastreamento Estratégico
*   **Tag Management:** Controle de métricas e conversão centralizado no Google Tag Manager (GTM), instalado no `<head>` e no `<body>` (fallback).
*   **Prevenção de CLS (Cumulative Layout Shift):** O AdSense opera sob uma injeção de frequência moderada (a cada 6 cartões). As `<div class="area-adsense">` possuem dimensões pré-estabelecidas no CSS para evitar o colapso estrutural da página durante o carregamento do anúncio em conexões 4G instáveis.

---

## ⚠️ Análise de Riscos e Trade-offs Conhecidos

Qualquer operador deste portal deve estar ciente dos seguintes compromissos assumidos na arquitetura:

1. **Gargalo de Performance (TBT):** A execução paralela do GTM (AdSense + Analytics) e do VLibras (renderização 3D) no carregamento da página eleva o *Total Blocking Time*. Em conexões móveis lentas, isso pode impactar o *Core Web Vitals*.
2. **Escalabilidade do JSON Base:** A busca no lado do cliente garante interatividade instantânea (zero delay de rede na filtragem). Contudo, se o arquivo `dados.json` ultrapassar a marca de 1.500 a 2.000 nós, o processamento de arrays comprometerá a CPU de smartphones de entrada. Caso o catálogo escale para este volume, a migração para renderização no lado do servidor (SSR) ou paginação via API será mandatória.
3. **Conflitos de Cache (Cloudflare):** A utilização de recursos de otimização agressiva do Cloudflare (como *Rocket Loader* ou minificação de JS em tempo real) apresenta alto risco de quebra dos scripts assíncronos do AdSense e GTM. É estritamente recomendado configurar *Page Rules* para contornar essas otimizações nas rotas de monetização.

---

## 🔄 Manual de Operação de Conteúdo

A adição ou remoção de entidades não exige conhecimento em programação, apenas rigor na estrutura de dados. 

### Atualizando o Diretório (`dados.json`)
Siga a taxonomia exata abaixo. Falhas em chaves ou vírgulas quebrarão o *parser* do JavaScript.

```json
{
  "id": "eq-00X",
  "categoria": "Equipamento",
  "nome": "Nome do Produto",
  "emoji": "🎒",
  "solucao_pratica": "Descreva a dor física ou de tempo que este item resolve.",
  "tags": ["Tag1", "Tag2"],
  "link_afiliado": "[https://link-de-conversao.com](https://link-de-conversao.com)"
}