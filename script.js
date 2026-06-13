document.addEventListener('DOMContentLoaded', () => {
    let baseDeDados = [];
    let categoriaAtiva = 'Todos';
    const htmlElement = document.documentElement;

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
            <a href="${p.url}" target="_blank" rel="noopener noreferrer" class="parceiro-link glass-effect" style="border-width: 2px;">
                <div style="display:flex; align-items:center; gap: 8px; margin-bottom: 8px;">
                    <span aria-hidden="true" style="font-size: 1.5rem;">${p.emoji || '🔗'}</span>
                    <span style="font-size: 0.8rem; color: var(--accent-primary); text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">${p.categoria}</span>
                </div>
                <strong style="font-size: 1.3rem;">${p.nome}</strong>
                <small style="color: var(--text-muted); margin-top: 8px; line-height: 1.4; display:block;">${p.descricao}</small>
            </a>
        `).join('');
    }

    function extrairEmojiDaCategoria(categoriaNome) {
        const item = baseDeDados.find(i => i.categoria === categoriaNome);
        return item && item.emoji ? item.emoji : '📌';
    }

    function renderizarFiltros() {
        const cats = ['Todos', ...new Set(baseDeDados.map(i => i.categoria))];
        const container = document.getElementById('bento-menu');
        
        container.innerHTML = cats.map(cat => {
            const ativo = cat === categoriaAtiva ? 'true' : 'false';
            const total = cat === 'Todos' ? baseDeDados.length : baseDeDados.filter(i => i.categoria === cat).length;
            const icone = cat === 'Todos' ? '🧭' : extrairEmojiDaCategoria(cat);
            
            return `
                <button type="button" class="bento-card glass-btn" data-cat="${cat}" aria-pressed="${ativo}">
                    <span aria-hidden="true">${icone}</span> 
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
        const campoBusca = document.getElementById('campo-busca');
        const termoNormalizado = campoBusca.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        const filtradas = baseDeDados.filter(item => {
            const textMatch = termoNormalizado === '' || (item.nome + " " + item.solucao_pratica + " " + item.tags.join(' ')).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(termoNormalizado);
            const catMatch = categoriaAtiva === 'Todos' || item.categoria === categoriaAtiva;
            return textMatch && catMatch;
        });

        document.getElementById('status-resultados').textContent = `${filtradas.length} soluções encontradas para o seu deslocamento.`;
        const container = document.getElementById('lista-ferramentas');
        
        if (!filtradas.length) { 
            container.innerHTML = '<p style="text-align:center; padding: 40px; color: var(--text-muted);">Nenhuma solução atende a este filtro. Limpe a busca e tente novamente.</p>'; 
            return; 
        }

        container.innerHTML = `<div class="grid-cards">` + filtradas.map(item => `
            <article class="card glass-effect">
                <div class="card-topo">
                    <span class="card-tag"><span aria-hidden="true">${item.emoji || '📌'}</span> ${item.categoria}</span>
                </div>
                <h3>${item.nome}</h3>
                <p class="card-desc">${item.solucao_pratica}</p>
                <div class="card-footer">
                    <button class="btn-card-abrir glass-btn" onclick="abrirModal('${item.id}')">Avaliar Solução</button>
                </div>
            </article>
        `).join('') + `</div>`;
    }

    const campoBusca = document.getElementById('campo-busca');
    campoBusca.addEventListener('input', () => { atualizarUrlParam('q', campoBusca.value); renderizarInterface(); });
    
    document.getElementById('btn-limpar-busca').addEventListener('click', () => { 
        campoBusca.value = ''; 
        categoriaAtiva = 'Todos'; 
        atualizarUrlParam('q', null); 
        renderizarFiltros(); 
        renderizarInterface(); 
    });

    window.abrirModal = function(id) {
        const item = baseDeDados.find(i => String(i.id) === String(id));
        if(!item) return;

        document.getElementById('artigo-emoji').textContent = item.emoji || '📌';
        document.getElementById('artigo-titulo').textContent = item.nome;
        document.getElementById('artigo-categoria').textContent = item.categoria;
        document.getElementById('artigo-dor').textContent = item.solucao_pratica;
        document.getElementById('artigo-descricao').textContent = `Fatores analisados: ${item.tags.join(', ')}.`;
        
        document.getElementById('artigo-link').href = item.link_afiliado || '#';
        document.getElementById('botoes-compartilhamento').innerHTML = `<button class="btn-share glass-btn" onclick="compartilhar('${item.nome}', '${item.id}')">Copiar Link e Avaliar</button>`;
        
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
            try { await navigator.share({ title: `Avaliação: ${nome}`, url: urlFinal }); } catch(err){}
        } else {
            navigator.clipboard.writeText(urlFinal).then(() => alert('Link copiado com sucesso.'));
        }
    };
});