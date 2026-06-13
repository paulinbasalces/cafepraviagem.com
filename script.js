document.addEventListener('DOMContentLoaded', () => {
    let baseDeDados = [];
    let baseParceiros = [];
    let categoriaAtiva = 'Todos';
    const FREQUENCIA_ADSENSE = 6; // Monetização Moderada
    const htmlElement = document.documentElement;

    /* ====================================================================
       1. ACESSIBILIDADE E TEMA (Salvo no LocalStorage)
       ==================================================================== */
    // Recupera preferências salvas
    if (localStorage.getItem('tema') === 'dark') htmlElement.setAttribute('data-theme', 'dark');
    
    const btnTema = document.getElementById('btn-tema');
    if(btnTema) {
        btnTema.addEventListener('click', () => {
            const isDark = htmlElement.getAttribute('data-theme') === 'dark';
            htmlElement.toggleAttribute('data-theme', !isDark);
            localStorage.setItem('tema', isDark ? 'light' : 'dark');
        });
    }

    let fontScale = parseInt(localStorage.getItem('fontScale'), 10) || 100;
    const atualizarFonte = () => { 
        htmlElement.style.fontSize = fontScale + '%'; 
        localStorage.setItem('fontScale', fontScale); 
    };
    atualizarFonte();
    
    const btnFonteMais = document.getElementById('btn-fonte-mais');
    const btnFonteMenos = document.getElementById('btn-fonte-menos');
    if(btnFonteMais) btnFonteMais.addEventListener('click', () => { if(fontScale < 130) { fontScale += 10; atualizarFonte(); } });
    if(btnFonteMenos) btnFonteMenos.addEventListener('click', () => { if(fontScale > 90) { fontScale -= 10; atualizarFonte(); } });

    /* ====================================================================
       2. CARREGAMENTO SIMULTÂNEO DE DADOS (Promise.all)
       ==================================================================== */
    carregarInfraestrutura();

    function carregarInfraestrutura() {
        // Dispara o carregamento do conteúdo e dos parceiros ao mesmo tempo
        Promise.all([
            fetch('dados.json').then(res => res.json()).catch(() => []),
            fetch('parceiros.json').then(res => res.json()).catch(() => [])
        ]).then(([dados, parceiros]) => {
            baseDeDados = dados;
            baseParceiros = parceiros;
            
            renderizarParceiros(baseParceiros);
            renderizarGrid(baseDeDados);
        });
    }

    /* ====================================================================
       3. RENDERIZAÇÃO DO RODAPÉ DINÂMICO (Parceiros)
       ==================================================================== */
    function renderizarParceiros(dadosParceiros) {
        const container = document.getElementById('grid-parceiros-container');
        if (!container || !dadosParceiros.length) return;
        
        const htmlParceiros = dadosParceiros.map(p => `
            <a href="${p.url}" target="_blank" rel="nofollow noopener" class="parceiro-link">
                <strong>${p.nome}</strong>
                <span style="display:block; font-size:0.8rem; color:var(--accent-primary); margin-bottom:4px;">${p.categoria}</span>
                <span>${p.descricao}</span>
            </a>
        `).join('');

        container.innerHTML = htmlParceiros;
    }

    /* ====================================================================
       4. MOTOR DE BUSCA, FILTROS E RENDERIZAÇÃO PRINCIPAL
       ==================================================================== */
    const gridResultados = document.getElementById('grid-resultados');
    const botoesFiltro = document.querySelectorAll('.btn-filtro');

    // Lógica dos Botões de Filtro
    botoesFiltro.forEach(botao => {
        botao.addEventListener('click', (e) => {
            botoesFiltro.forEach(b => b.classList.remove('ativo'));
            e.target.classList.add('ativo');

            categoriaAtiva = e.target.getAttribute('data-filtro');
            filtrarEAtualizarGrid();
        });
    });

    function filtrarEAtualizarGrid() {
        if (categoriaAtiva === 'Todos') {
            renderizarGrid(baseDeDados);
        } else {
            const dadosFiltrados = baseDeDados.filter(item => item.categoria === categoriaAtiva);
            renderizarGrid(dadosFiltrados);
        }
    }

    function renderizarGrid(dadosParaRenderizar) {
        if (!gridResultados) return;
        gridResultados.innerHTML = ''; // Limpa o grid atual

        if(dadosParaRenderizar.length === 0) {
            gridResultados.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">Nenhum item encontrado nesta categoria.</p>';
            return;
        }

        dadosParaRenderizar.forEach((item, index) => {
            // Cria o Cartão de Conteúdo
            const cartao = document.createElement('article');
            cartao.className = 'cartao';
            cartao.innerHTML = `
                <div class="cartao-img" style="background-image: url('${item.imagem_url}')">
                    <span class="etiqueta-categoria">${item.categoria}</span>
                </div>
                <div class="cartao-conteudo">
                    <h2>${item.nome}</h2>
                    <p>${item.solucao_pratica}</p>
                    <div class="tags">
                        ${item.tags.map(tag => `<span>#${tag}</span>`).join('')}
                    </div>
                    <a href="${item.link_afiliado}" target="_blank" rel="nofollow noopener" class="btn-acao">Ver Detalhes Oficiais</a>
                </div>
            `;
            gridResultados.appendChild(cartao);

            // ====================================================================
            // 5. MOTOR DE INJEÇÃO DE ADSENSE (Prevenção de CLS)
            // ====================================================================
            // Injeta um bloco rígido a cada X cartões (definido na variável FREQUENCIA_ADSENSE)
            if ((index + 1) % FREQUENCIA_ADSENSE === 0 && index !== dadosParaRenderizar.length - 1) {
                const adsenseBlock = document.createElement('div');
                adsenseBlock.className = 'area-adsense';
                adsenseBlock.innerHTML = `
                    <ins class="adsbygoogle"
                         style="display:block"
                         data-ad-client="ca-pub-SEU_CODIGO_AQUI"
                         data-ad-slot="SEU_SLOT_AQUI"
                         data-ad-format="auto"
                         data-full-width-responsive="true"></ins>
                    <script>(adsbygoogle = window.adsbygoogle || []).push({});<\/script>
                `;
                gridResultados.appendChild(adsenseBlock);
            }
        });
    }
});