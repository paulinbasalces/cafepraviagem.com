# ☕ Café Pra Viagem

O **Café Pra Viagem** nasceu para resolver uma cena muito específica, mas extremamente comum: a pessoa ama café, mas a rotina não permite sentar com calma para consumir bem. O deslocamento, a saída cedo, a correria entre compromissos e a dificuldade de encontrar boas opções no caminho criam um espaço perfeito para um portal editorial focado em café em movimento.

Este projeto organiza, em uma arquitetura estática e escalável, um hub sobre **receitas portáteis, equipamentos, cafeterias, grãos e dicas práticas** para quem quer sair com o café sem transformar isso em um ritual inviável.

---

## A história do produto

Quando pensei neste portal, eu não queria criar “mais um site sobre café”. A internet já está cheia de listas genéricas, reviews pouco honestos e conteúdos que ignoram a vida real. O que me interessava era um recorte mais inteligente: **o café como companheiro de deslocamento**.

É aí que nasce o Café Pra Viagem.

A proposta é simples: reduzir atrito. Ajudar o usuário a descobrir o que funciona quando ele precisa preparar em casa, levar com segurança, beber no caminho, escolher melhor um recipiente, decidir qual grão faz sentido para uma rotina portátil ou até encontrar uma cafeteria com recomendação razoável quando sentar é quase impossível.

---

## Visão do produto

**Problema:** amantes de café e pessoas em movimento convivem com escolhas ruins, excesso de improviso, pouca curadoria específica para portabilidade e uma experiência frequentemente frustrante entre praticidade e qualidade.

**Solução:** um portal curatorial com estrutura leve, busca local, filtros Bento, badges semânticas, modais compartilháveis e base de dados em JSON para organizar o ecossistema do café pra viagem com clareza editorial.

---

## Estratégia editorial

O portal não pretende esgotar o universo do café. Ele opera em um território muito claro:

- Café para quem está saindo.
- Café para quem não consegue parar.
- Café para quem quer praticidade, sem cair em soluções ruins.
- Café para quem busca melhores decisões em receitas, compra, transporte e parada rápida.

Essa clareza de posicionamento permite que o conteúdo tenha utilidade real e identidade própria.

---

## Arquitetura do projeto

O Café Pra Viagem foi estruturado em uma arquitetura **serverless/static**, usando apenas:

- `HTML`
- `CSS`
- `JavaScript`
- `JSON`

Essa decisão reduz custo de infraestrutura, melhora velocidade, simplifica manutenção e fortalece SEO técnico. O conteúdo vive desacoplado em arquivos de dados, permitindo expansão curatorial com baixo atrito operacional.

### Estrutura dos arquivos

- `index.html` — interface principal do portal.
- `style.css` — design system glassmorphism com light/dark mode.
- `script.js` — motor de busca, filtros, modais, tags e parceiros.
- `dados.json` — base principal da curadoria.
- `parceiros.json` — ecossistema de projetos parceiros.
- `tags.json` — configuração visual das badges.
- `sobre.html` — metodologia editorial.
- `privacidade.html` — política de privacidade e navegação local.
- `robots.txt` — orientação para crawlers.
- `sitemap.xml` — indexação técnica do portal.

---

## Direção de experiência

A identidade do produto mistura dois imaginários:

1. **Café** — calor, textura, ritual, aroma, pausa, torra, matéria.
2. **Viagem** — deslocamento, rota, tempo curto, movimento, praticidade, transição.

Essa combinação orienta cores, tipografia, linguagem, estrutura visual e priorização do conteúdo.

---

## O que torna este portal relevante

- Resolve um contexto de uso específico e frequente.
- Não trata café como decoração, mas como rotina prática.
- Facilita descoberta de receitas, itens e referências sem confundir o usuário.
- Pode crescer organicamente com SEO, monetização e expansão editorial.
- Faz parte de uma rede de portais com arquitetura reutilizável e identidade própria.

---

## Declaração final

Como Product Manager, eu penso este projeto como uma camada de utilidade editorial. O papel do Café Pra Viagem não é falar mais alto do que o usuário. É ajudá-lo a sair melhor preparado.

**Paulin Basalces**  
Product Manager
