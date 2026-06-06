// script.js
document.addEventListener('DOMContentLoaded', () => {
  let baseDeDados = [];
  let configTags = {};
  let parceirosDaRede = [];
  let categoriaAtiva = 'Todas';

  const htmlElement = document.documentElement;
  const campoBusca = document.getElementById('campo-busca');
  const btnLimpar = document.getElementById('btn-limpar-busca');
  const btnGoogleBusca = document.getElementById('btn-google-busca');
  const btnTema = document.getElementById('btn-tema');
  const btnFonteMais = document.getElementById('btn-fonte-mais');
  const btnFonteMenos = document.getElementById('btn-fonte-menos');
  const containerBento = document.getElementById('bento-menu');
  const containerLista = document.getElementById('lista-ferramentas');
  const statusResultados = document.getElementById('status-resultados');
  const totalFerramentas = document.getElementById('total-ferramentas');
  const totalCategorias = document.getElementById('total-categorias');
  const parceirosContainer = document.getElementById('grid-parceiros-container');
  const modalOverlay = document.getElementById('modal-overlay');
  const fecharModalBtn = document.getElementById('fechar-modal');

  const tituloModal = document.getElementById('artigo-titulo');
  const categoriaModal = document.getElementById('artigo-categoria');
  const emojiModal = document.getElementById('artigo-emoji');
  const dorModal = document.getElementById('artigo-dor');
  const descricaoModal = document.getElementById('artigo-descricao');
  const melhorParaModal = document.getElementById('artigo-melhor-para');
  const cuidadoModal = document.getElementById('artigo-cuidado');
  const linkModal = document.getElementById('artigo-link');
  const tagsModal = document.getElementById('artigo-tags');
  const botoesCompartilhamento = document.getElementById('botoes-compartilhamento');

  const storageSeguro = (() => {
    try {
      const chave = '__cpv_test__';
      localStorage.setItem(chave, '1');
      localStorage.removeItem(chave);
      return localStorage;
    } catch (error) {
      return null;
    }
  })();

  const stateTemporario = {
    tema: null,
    fonte: 100
  };

  const lerPreferencia = (chave) => {
    if (storageSeguro) return storageSeguro.getItem(chave);
    return stateTemporario[chave];
  };

  const salvarPreferencia = (chave, valor) => {
    if (storageSeguro) {
      storageSeguro.setItem(chave, valor);
      return;
    }
    stateTemporario[chave] = valor;
  };

  const normalizarTexto = (texto = '') =>
    texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const extrairTags = (titulo = '') => {
    const regex = /\[(.*?)\]/g;
    const tags = [];
    let tituloLimpo = titulo;
    let match;

    while ((match = regex.exec(titulo)) !== null) {
      tags.push(match[1].trim());
      tituloLimpo = tituloLimpo.replace(match[0], '').trim();
    }

    return { tituloLimpo, tags };
  };

  const configurarTema = () => {
    const temaSalvo = lerPreferencia('tema');
    if (temaSalvo === 'light' || temaSalvo === 'dark') {
      htmlElement.setAttribute('data-theme', temaSalvo);
      atualizarIconeTema(temaSalvo);
      return;
    }

    const prefereEscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const temaInicial = prefereEscuro ? 'dark' : 'light';
    htmlElement.setAttribute('data-theme', temaInicial);
    atualizarIconeTema(temaInicial);
  };

  const atualizarIconeTema = (temaAtual) => {
    if (!btnTema) return;

    btnTema.setAttribute('aria-label', temaAtual === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro');

    if (temaAtual === 'dark') {
      btnTema.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5"></circle>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
        </svg>
      `;
    } else {
      btnTema.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      `;
    }
  };

  const configurarFonte = () => {
    const fonteSalva = parseInt(lerPreferencia('fonte') || '100', 10);
    const valorInicial = Number.isNaN(fonteSalva) ? 100 : fonteSalva;
    htmlElement.style.fontSize = `${valorInicial}%`;
    stateTemporario.fonte = valorInicial;
  };

  const atualizarFonte = (novoValor) => {
    stateTemporario.fonte = novoValor;
    htmlElement.style.fontSize = `${novoValor}%`;
    salvarPreferencia('fonte', String(novoValor));
  };

  const atualizarUrlParam = (chave, valor) => {
    const url = new URL(window.location.href);
    if (!valor) {
      url.searchParams.delete(chave);
    } else {
      url.searchParams.set(chave, valor);
    }
    window.history.replaceState({}, '', url);
  };

  const renderizarParceiros = () => {
    if (!parceirosContainer) return;

    parceirosContainer.innerHTML = parceirosDaRede.map((parceiro) => `
      <a class="parceiro-card glass-effect" href="${parceiro.url}" target="_blank" rel="noopener noreferrer">
        <p class="parceiro-categoria">${parceiro.categoria}</p>
        <strong>${parceiro.nome}</strong>
        <span>${parceiro.descricao}</span>
      </a>
    `).join('');
  };

  const montarResumoCategoria = (categoria) => {
    const total = categoria === 'Todas'
      ? baseDeDados.length
      : baseDeDados.filter((item) => item.categoria === categoria).length;

    const itemDaCategoria = baseDeDados.find((item) => item.categoria === categoria);

    return {
      total,
      emoji: categoria === 'Todas' ? '☕' : (itemDaCategoria?.emoji || '☕')
    };
  };

  const renderizarFiltros = () => {
    if (!containerBento) return;

    const categorias = ['Todas', ...new Set(baseDeDados.map((item) => item.categoria))];

    containerBento.innerHTML = categorias.map((categoria) => {
      const resumo = montarResumoCategoria(categoria);
      const ativo = categoria === categoriaAtiva ? 'true' : 'false';

      return `
        <button class="bento-card" type="button" data-cat="${categoria}" aria-pressed="${ativo}">
          <span class="bento-card-emoji">${resumo.emoji}</span>
          <span class="bento-card-copy">
            <strong>${categoria}</strong>
            <small>${resumo.total} itens</small>
          </span>
        </button>
      `;
    }).join('');

    containerBento.querySelectorAll('.bento-card').forEach((botao) => {
      botao.addEventListener('click', () => {
        categoriaAtiva = botao.dataset.cat;
        renderizarFiltros();
        renderizarInterface();
      });
    });
  };

  const construirBadgeHtml = (tagNome) => {
    const config = configTags[tagNome];

    if (config) {
      return `<span class="card-alert-tag" style="color:${config.color}; background:${config.bg}; border-color:${config.border};">${config.label}</span>`;
    }

    return `<span class="card-alert-tag">${tagNome}</span>`;
  };

  const abrirModal = (item, atualizarHistorico = true) => {
    const { tituloLimpo, tags } = extrairTags(item.nome);

    tituloModal.textContent = tituloLimpo;
    categoriaModal.textContent = item.categoria;
    emojiModal.textContent = item.emoji || '☕';
    dorModal.textContent = item.dor_resolvida;
    descricaoModal.textContent = item.descricao;
    melhorParaModal.textContent = item.melhor_para;
    cuidadoModal.textContent = item.cuidado;
    linkModal.href = item.url;
    tagsModal.innerHTML = tags.map(construirBadgeHtml).join('');
    construirCompartilhamento(item);

    modalOverlay.classList.remove('hidden');
    modalOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    if (atualizarHistorico) {
      const url = new URL(window.location.href);
      url.searchParams.set('modal', item.id);
      window.history.pushState({ modal: item.id }, '', url);
    }
  };

  const fecharModal = (atualizarHistorico = true) => {
    modalOverlay.classList.add('hidden');
    modalOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    if (atualizarHistorico) {
      const url = new URL(window.location.href);
      url.searchParams.delete('modal');
      window.history.pushState({}, '', url);
    }
  };

  const construirCompartilhamento = (item) => {
    const { tituloLimpo } = extrairTags(item.nome);
    const urlCompartilhavel = `${window.location.origin}${window.location.pathname}?modal=${item.id}`;
    const texto = `Achei isso no Café Pra Viagem: ${tituloLimpo}`;

    botoesCompartilhamento.innerHTML = `
      <button class="btn-share" type="button" id="share-native">Compartilhar</button>
      <button class="btn-share" type="button" id="share-copy">Copiar link</button>
    `;

    const shareNative = document.getElementById('share-native');
    const shareCopy = document.getElementById('share-copy');

    shareNative.addEventListener('click', async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: tituloLimpo,
            text: texto,
            url: urlCompartilhavel
          });
        } catch (error) {}
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(`${texto} ${urlCompartilhavel}`)}`, '_blank', 'noopener,noreferrer');
      }
    });

    shareCopy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(urlCompartilhavel);
        shareCopy.textContent = 'Link copiado';
        setTimeout(() => {
          shareCopy.textContent = 'Copiar link';
        }, 1800);
      } catch (error) {
        shareCopy.textContent = 'Não foi possível copiar';
      }
    });
  };

  const abrirModalDaUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const modalId = params.get('modal');
    if (!modalId) return;

    const item = baseDeDados.find((entry) => String(entry.id) === String(modalId));
    if (item) abrirModal(item, false);
  };

  const renderizarCards = (itens) => {
    if (!itens.length) {
      containerLista.innerHTML = `
        <article class="card-vazio glass-effect">
          <h3>Nenhum resultado local encontrado</h3>
          <p>Tente termos como “mug térmica”, “cold brew”, “cafeteria”, “grão doce”, “método portátil” ou use a busca no Google para ampliar o mapa.</p>
        </article>
      `;
      return;
    }

    const grupos = itens.reduce((acc, item) => {
      if (!acc[item.categoria]) acc[item.categoria] = [];
      acc[item.categoria].push(item);
      return acc;
    }, {});

    containerLista.innerHTML = Object.entries(grupos).map(([categoria, grupo]) => `
      <section class="categoria-bloco">
        <h2>${categoria}</h2>
        <div class="categoria-grid">
          ${grupo.map((item) => {
            const { tituloLimpo, tags } = extrairTags(item.nome);
            return `
              <article class="card-portal glass-effect">
                <div class="card-topo">
                  <span class="card-emoji">${item.emoji || '☕'}</span>
                  <p class="card-categoria">${item.categoria}</p>
                </div>
                <h3>${tituloLimpo}</h3>
                <p class="card-dor">${item.dor_resolvida}</p>
                <p class="card-descricao">${item.descricao}</p>
                ${tags.length ? `<div class="tags-container">${tags.map(construirBadgeHtml).join('')}</div>` : ''}
                <div class="card-footer">
                  <button class="btn-card-acao secundario" type="button" data-id="${item.id}">Ver detalhes</button>
                  <a class="btn-card-acao primario" href="${item.url}" target="_blank" rel="noopener noreferrer">Abrir fonte</a>
                </div>
              </article>
            `;
          }).join('')}
        </div>
      </section>
    `).join('');

    containerLista.querySelectorAll('[data-id]').forEach((botao) => {
      botao.addEventListener('click', () => {
        const item = baseDeDados.find((entry) => String(entry.id) === String(botao.dataset.id));
        if (item) abrirModal(item);
      });
    });
  };

  const renderizarInterface = () => {
    const termo = normalizarTexto(campoBusca.value.trim());

    const filtradas = baseDeDados.filter((item) => {
      const textoBase = normalizarTexto([
        item.nome,
        item.categoria,
        item.dor_resolvida,
        item.descricao,
        item.melhor_para,
        item.cuidado
      ].join(' '));

      const bateTexto = termo === '' || textoBase.includes(termo);
      const bateCategoria = categoriaAtiva === 'Todas' || item.categoria === categoriaAtiva;

      return bateTexto && bateCategoria;
    });

    statusResultados.textContent = `${filtradas.length} referências locais encontradas. Use “Buscar no Google” para ampliar a pesquisa externa.`;
    renderizarCards(filtradas);
  };

  const carregarInfraestrutura = async () => {
    try {
      const [dados, parceiros, tags] = await Promise.all([
        fetch('dados.json').then((res) => res.json()),
        fetch('parceiros.json').then((res) => res.json()),
        fetch('tags.json').then((res) => res.json())
      ]);

      baseDeDados = Array.isArray(dados) ? dados : [];
      parceirosDaRede = Array.isArray(parceiros) ? parceiros : [];
      configTags = tags || {};

      totalFerramentas.textContent = String(baseDeDados.length);
      totalCategorias.textContent = String(new Set(baseDeDados.map((item) => item.categoria)).size);

      const queryInicial = new URLSearchParams(window.location.search).get('q');
      if (queryInicial) campoBusca.value = queryInicial;

      renderizarParceiros();
      renderizarFiltros();
      renderizarInterface();
      abrirModalDaUrl();
    } catch (error) {
      statusResultados.textContent = 'Não foi possível carregar a curadoria local agora.';
      containerLista.innerHTML = `
        <article class="card-vazio glass-effect">
          <h3>Falha ao carregar o portal</h3>
          <p>Verifique se os arquivos <code>dados.json</code>, <code>parceiros.json</code> e <code>tags.json</code> estão na mesma pasta do site.</p>
        </article>
      `;
    }
  };

  configurarTema();
  configurarFonte();

  btnTema.addEventListener('click', () => {
    const temaAtual = htmlElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const proximoTema = temaAtual === 'dark' ? 'light' : 'dark';
    htmlElement.setAttribute('data-theme', proximoTema);
    salvarPreferencia('tema', proximoTema);
    atualizarIconeTema(proximoTema);
  });

  btnFonteMais.addEventListener('click', () => {
    if (stateTemporario.fonte < 130) atualizarFonte(stateTemporario.fonte + 10);
  });

  btnFonteMenos.addEventListener('click', () => {
    if (stateTemporario.fonte > 90) atualizarFonte(stateTemporario.fonte - 10);
  });

  campoBusca.addEventListener('input', () => {
    const valor = campoBusca.value.trim();
    atualizarUrlParam('q', valor || null);
    renderizarInterface();
  });

  btnLimpar.addEventListener('click', () => {
    campoBusca.value = '';
    categoriaAtiva = 'Todas';
    atualizarUrlParam('q', null);
    renderizarFiltros();
    renderizarInterface();
    campoBusca.focus();
  });

  btnGoogleBusca.addEventListener('click', () => {
    const termo = campoBusca.value.trim();
    const consulta = termo ? `${termo} café pra viagem` : 'café pra viagem';
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(consulta)}`;
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
  });

  fecharModalBtn.addEventListener('click', () => fecharModal());

  modalOverlay.addEventListener('click', (event) => {
    if (event.target === modalOverlay) fecharModal();
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modalOverlay.classList.contains('hidden')) {
      fecharModal();
    }
  });

  window.addEventListener('popstate', () => {
    const modalId = new URLSearchParams(window.location.search).get('modal');
    if (!modalId) {
      modalOverlay.classList.add('hidden');
      modalOverlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      return;
    }

    const item = baseDeDados.find((entry) => String(entry.id) === String(modalId));
    if (item) abrirModal(item, false);
  });

  carregarInfraestrutura();
});
