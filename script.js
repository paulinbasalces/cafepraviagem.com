document.addEventListener('DOMContentLoaded', () => {
    let baseDeDados = [];
    let configTags = {};
    let categoriaAtiva = 'Todos';
    const htmlElement = document.documentElement;

    /* Acessibilidade de Tema e Tipografia */
    if (localStorage.getItem('tema') === 'light') htmlElement.setAttribute('data-theme', 'light');
    
    document.getElementById('btn-tema').addEventListener('click', () => {
        const isDark = htmlElement.getAttribute('data-theme') === 'dark';
        htmlElement.toggleAttribute('data-theme', !isDark);
        localStorage.setItem('tema', isDark ? 'light' : 'dark');
    });

    let fontScale = parseInt(localStorage.getItem('fontScale'), 10) || 100;
    const atualizarFonte = () => { htmlElement.style.fontSize = fontScale + '%'; localStorage.setItem('fontScale', fontScale); };
    atualizarFonte();
    
    document.getElementById('btn-fonte-mais').addEventListener('click', () => { if(fontScale < 130) { fontScale += 10; atualizarFonte(); } });
    document.getElementById('btn-fonte-menos').addEventListener('click', () => { if(fontScale > 90) { fontScale -= 10; atualizarFonte(); } });

    /* Fetch Simultâneo: Curadoria e Parceiros */
    carregarInfraestrutura();

    function carregarInfraestrutura() {
        Promise.all([
            fetch('dados.json').then(res => res.json()).catch(() => []),
            fetch('parceiros.json').then(res => res.json()).catch(() => [])
        ]).then(([dados, parceiros]) => {
            baseDeDados = dados;
            
            document.getElementById('total-ferramentas').textContent = baseDeDados.length;
            document.getElementById('total-categorias').textContent = new Set(baseDeDados.map(i => i.categoria)).size;
            
            renderizarParceiros(parceiros);
            renderizarFiltros();
            renderizarInterface();
            abrirModalDaUrl();
        });
    }

    function renderizarParceiros(data) {
        const container = document.getElementById('grid-parceiros-container');
        if (!container || !data.length) return;
        
        container.innerHTML = data.map(p => `
            <a href="${p.url}" target="_blank" rel="noopener noreferrer" class="parceiro-link glass-effect">
                <span style="font-size: 0.75rem; color: var(--accent-primary); text-transform: uppercase; font-weight: 700;">${p.categoria}</span>
                <strong>${p.nome}</strong>
                <small style="color: var(--text-muted); margin-top: 4px;">${p.descricao}</small>
            </a>
        `).join('');
    }

    /* Motor de Busca e Menu Bento */
    const campoBusca = document.getElementById('campo-busca');
    const btnLimpar = document.getElementById('btn-limpar-busca');
    const btnGoogleBusca = document.getElementById('btn-google-busca');

    campoBusca.addEventListener('input', () => { atualizarUrlParam('q', campoBusca.value); renderizarInterface(); });
    
    btnLimpar.addEventListener('click', () => { 
        campoBusca.value = ''; 
        categoriaAtiva = 'Todos'; 
        atualizarUrlParam('q', null); 
        renderizarFiltros(); 
        renderizarInterface(); 
    });

    if (btnGoogleBusca) {
        btnGoogleBusca.addEventListener('click', () => {
            const query = campoBusca.value.trim();
            if (query) {
                const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query + ' café equipamento portátil')}`;
                window.open(searchUrl, '_blank');
            } else {
                campoBusca.focus();
            }
        });
    }

    function renderizarFiltros() {
        const cats = ['Todos', ...new Set(baseDeDados.map(i => i.categoria))];
        const container = document.getElementById('bento-menu');
        
        container.innerHTML = cats.map(cat => {
            const ativo = cat === categoriaAtiva ? 'true' : 'false';
            const total = cat === 'Todos' ? baseDeDados.length : baseDeDados.filter(i => i.categoria === cat).length;
            
            return `
                <button type="button" class="bento-card glass-btn" data-cat="${cat}" aria-pressed="${ativo}">
                    <span>${cat}</span> 
                    <strong>(${total})</strong>
                </button>`;
        }).join('');
        
        container.querySelectorAll('.bento-card').forEach(btn => btn.addEventListener('click', () => {
            categoriaAtiva = btn.dataset.cat; 
            renderizarFiltros(); 
            renderizarInterface();
        }));
    }

    function renderizarInterface() {
        const termoOriginal = campoBusca.value;
        const termoNormalizado = termoOriginal.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        const filtradas = baseDeDados.filter(item => {
            const textMatch = termoNormalizado === '' || (item.nome + " " + item.solucao_pratica + " " + item.tags.join(' ')).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(termoNormalizado);
            const catMatch = categoriaAtiva === 'Todos' || item.categoria === categoriaAtiva;
            return textMatch && catMatch;
        });

        document.getElementById('status-resultados').textContent = `${filtradas.length} soluções locais encontradas.`;
        const container = document.getElementById('lista-ferramentas');
        
        if (!filtradas.length) { 
            container.innerHTML = '<p style="text-align:center; padding: 40px; color: var(--text-muted);">Nenhum equipamento ou café encontrado. Tente a "Busca no Google".</p>'; 
            return; 
        }

        container.innerHTML = `<div class="grid-cards">` + filtradas.map(item => `
            <article class="card glass-effect">
                <div class="card-topo">
                    <span class="card-tag">${item.categoria}</span>
                </div>
                <h3>${item.nome}</h3>
                <p class="card-desc">${item.solucao_pratica}</p>
                <div class="card-footer">
                    <button class="btn-card-abrir glass-btn" onclick="abrirModal('${item.id}')">Ver Avaliação</button>
                </div>
            </article>
        `).join('') + `</div>`;
    }

    /* Lógica de Modal e Web Share API */
    window.abrirModal = function(id) {
        const item = baseDeDados.find(i => String(i.id) === String(id));
        if(!item) return;

        document.getElementById('artigo-titulo').textContent = item.nome;
        document.getElementById('artigo-categoria').textContent = item.categoria;
        document.getElementById('artigo-dor').textContent = item.solucao_pratica;
        document.getElementById('artigo-descricao').textContent = `Tags analisadas: ${item.tags.join(', ')}.`;
        
        const btnLink = document.getElementById('artigo-link');
        btnLink.href = item.link_afiliado || '#';
        
        const btnShare = document.getElementById('botoes-compartilhamento');
        btnShare.innerHTML = `<button class="btn-share glass-btn" onclick="compartilhar('${item.nome}', '${item.id}')">Copiar Link e Indicar</button>`;
        
        const modal = document.getElementById('modal-overlay');
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
        
        atualizarUrlParam('modal', item.id);
        document.getElementById('fechar-modal').focus();
    };

    const modalOverlay = document.getElementById('modal-overlay');
    document.getElementById('fechar-modal').addEventListener('click', fecharModal);
    modalOverlay.addEventListener('click', (e) => { if(e.target.id === 'modal-overlay') fecharModal(); });
    document.addEventListener('keydown', (e) => { if(e.key === 'Escape' && !modalOverlay.classList.contains('hidden')) fecharModal(); });
    
    function fecharModal() {
        modalOverlay.classList.add('hidden');
        modalOverlay.setAttribute('aria-hidden', 'true');
        atualizarUrlParam('modal', null);
    }

    function atualizarUrlParam(key, value) {
        const url = new URL(window.location.href);
        if (value) url.searchParams.set(key, value); else url.searchParams.delete(key);
        window.history.replaceState({}, '', url);
    }

    function abrirModalDaUrl() {
        const modalId = new URLSearchParams(window.location.search).get('modal');
        if (modalId && baseDeDados.length > 0) window.abrirModal(modalId);
    }

    window.compartilhar = async function(nome, id) {
        const urlFinal = `${window.location.origin}${window.location.pathname}?modal=${id}`;
        if (navigator.share) {
            try { await navigator.share({ title: `Curadoria Café: ${nome}`, url: urlFinal }); } catch(err){}
        } else {
            navigator.clipboard.writeText(urlFinal).then(() => alert('Link estruturado copiado com sucesso!'));
        }
    };
});