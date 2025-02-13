let cache = null;
let itensFiltrados = [];
let paginaAtual = 30; // Onde a lista será iniciada
const itensPorPagina = 500; // Número de músicas na tela
// Armazenar favoritos no localStorage
let favoritos = [];
try {
    favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
} catch (e) {
    console.error('Erro ao carregar favoritos do localStorage:', e);
    localStorage.setItem('favoritos', JSON.stringify([])); // Reseta o localStorage se estiver corrompido
}

async function carregarCatalogo() {
    const aviso = document.getElementById('aviso');
    aviso.textContent = 'Carregando catálogo...';
    aviso.style.color = '#fff';

    try {
        if (!cache) {
            const response = await fetch('songs.json');
            if (!response.ok) throw new Error('Erro ao carregar dados');
            cache = await response.json();
            itensFiltrados = [...cache];
        }

        aviso.textContent = '';
        atualizarCatalogo();
    } catch (erro) {
        aviso.textContent = 'Erro ao carregar o catálogo. Atualize a página.';
        aviso.style.color = '#ff6f61';
        console.error(erro);
    }
}

// Unificação da função toggleFavorito
function toggleFavorito(numeroStr) {
    if (!cache) {
        console.error('Cache não foi carregado.');
        return;
    }

    const numero = Number(numeroStr);
    const musica = cache.find(m => m.numero === numero);
    
    if (!musica) return; // Se não encontrar, sai da função
    
    const index = favoritos.findIndex(fav => fav.numero === numero);
    if (index === -1) {
        favoritos.push(musica); // Adiciona aos favoritos
    } else {
        favoritos.splice(index, 1); // Remove dos favoritos
    }
    
    localStorage.setItem('favoritos', JSON.stringify(favoritos)); // Atualiza o localStorage
    atualizarCatalogo(); // Atualiza a exibição no catálogo
    if (window.location.pathname.endsWith('favoritos.html')) {
        exibirFavoritos(); // Atualiza a página de favoritos também
    }
}

function atualizarCatalogo() {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const catalogo = document.getElementById('catalogo');
    catalogo.innerHTML = itensFiltrados
        .slice(inicio, fim)
        .map(musica => `
            <div class="item-lista">
               <div class="numero">${musica.numero || ''}</div>
                <div>${musica.musica || ''}</div>
                <div class="cantor">${musica.cantor || ''}</div>
                <span class="favorito-btn" onclick="toggleFavorito('${musica.numero}')">
                    ${favoritos.some(fav => fav.numero === musica.numero) ? '❤️' : '🤍'}
                </span>
            </div>
        `).join('');
    atualizarPaginacao();
}

function exibirFavoritos() {
    const favoritosContainer = document.getElementById('favoritos');
    
    if (favoritosContainer) {
        favoritosContainer.innerHTML = '';

        if (favoritos.length === 0) {
            favoritosContainer.innerHTML = `
                <p class="sem-favoritos">Nenhuma música favoritada ainda. 😢</p>
            `;
            return;
        }

        favoritosContainer.innerHTML = favoritos
            .map(musica => `
                <div class="item-lista">
                    <div class="numero">${musica.numero || ''}</div>
                    <div>${musica.musica || 'Título Desconhecido'}</div>
                    <div class="cantor">${musica.cantor || 'Artista Desconhecido'}</div>
                    <span class="favorito-btn" onclick="toggleFavorito('${musica.numero}')">
                          ${favoritos.some(fav => fav.numero === musica.numero) ? '❤️' : '🤍'}
                    </span>
                </div>
            `).join('');
    }
}

function atualizarPaginacao() {
    const totalPaginas = Math.max(1, Math.ceil(itensFiltrados.length / itensPorPagina));
    
    const infoPaginacao = document.getElementById('info-paginacao');
    if (infoPaginacao) {
        infoPaginacao.textContent = "Página " + paginaAtual + " de " + totalPaginas;
    }

    const btnAnterior = document.getElementById('anterior');
    const btnProximo = document.getElementById('proximo');

    if (btnAnterior) btnAnterior.disabled = paginaAtual <= 1;
    if (btnProximo) btnProximo.disabled = paginaAtual >= totalPaginas;
}

function filtrarCatalogo(event) {
    const termo = event.target.value.trim().toLowerCase();

    itensFiltrados = cache.filter(item => {
        const numero = item.numero?.toString().toLowerCase() || '';
        const musica = item.musica?.toString().toLowerCase() || '';
        const cantor = item.cantor?.toString().toLowerCase() || '';

        return numero.includes(termo) || musica.includes(termo) || cantor.includes(termo);
    });

    paginaAtual = 1;
    atualizarCatalogo();
}

// Função de debounce para otimizar a pesquisa
const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
};

// Event Listeners com verificação de existência
const pesquisaInput = document.getElementById('pesquisa');
const btnAnterior = document.getElementById('anterior');
const btnProximo = document.getElementById('proximo');

if (pesquisaInput) {
  pesquisaInput.addEventListener('input', debounce(filtrarCatalogo, 300));
}

if (btnAnterior) {
  btnAnterior.addEventListener('click', () => {
    if (paginaAtual > 1) {
      paginaAtual--;
      atualizarCatalogo();
    }
  });
}

if (btnProximo) {
  btnProximo.addEventListener('click', () => {
    if (paginaAtual < Math.ceil(itensFiltrados.length / itensPorPagina)) {
      paginaAtual++;
      atualizarCatalogo();
    }
  });
}

// Registrar o Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then((registration) => {
                console.log('Service Worker registrado com sucesso:', registration.scope);
            })
            .catch((error) => {
                console.log('Falha ao registrar o Service Worker:', error);
            });
    });
}

let deferredPrompt = null;

// script.js
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  setTimeout(() => {
    if (deferredPrompt) {
      showInstallPromotion();
    }
  }, 5000);
});

function showInstallPromotion() {
    const installButton = document.createElement('button');
    installButton.id = 'installButton';
	installButton.innerHTML = '📲 Install';
   // installButton.innerHTML = '📲 Instalar App';
    
    // Estilo do botão
    installButton.style.position = 'fixed';
    installButton.style.top = '10px';
    installButton.style.left = '0px';  // Alinhado à esquerda
    installButton.style.padding = '5px 5px';
    installButton.style.backgroundColor = '#4CAF50';  // Cor de fundo
    installButton.style.color = 'white';  // Cor do texto
    installButton.style.fontSize = '14px';
    installButton.style.fontWeight = 'bold';
    installButton.style.border = 'none';
    installButton.style.borderRadius = '30px';  // Borda arredondada
    installButton.style.boxShadow = '0px 4px 6px rgba(0, 0, 0, 0.2)';  // Sombra sutil
    installButton.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';  // Transição suave
    installButton.style.zIndex = '10000';  // Garantindo que o botão fique acima de outros elementos
    
    // Efeito ao passar o mouse
    installButton.addEventListener('mouseover', () => {
        installButton.style.transform = 'scale(1.1)';
        installButton.style.boxShadow = '0px 8px 12px rgba(0, 0, 0, 0.3)';
    });

    installButton.addEventListener('mouseout', () => {
        installButton.style.transform = 'scale(1)';
        installButton.style.boxShadow = '0px 4px 6px rgba(0, 0, 0, 0.2)';
    });

    // Ação de clique
    installButton.addEventListener('click', async () => {
        installButton.style.display = 'none';
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                console.log('Usuário aceitou a instalação');
            }
            deferredPrompt = null;
        }
    });
    
    document.body.appendChild(installButton);
}

// Atualizar Service Worker quando nova versão estiver disponível
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
    });
}


document.addEventListener("DOMContentLoaded", atualizarFavoritos);

function atualizarFavoritos() {
    let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
    document.querySelector(".favoritos-link .counter").textContent = favoritos.length;
}

function adicionarFavorito() {
    let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
    favoritos.push("novo_item"); // Simula a adição de um item
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
    
    location.reload(); // Atualiza a página após adicionar um favorito
}

function removerFavorito() {
    let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
    if (favoritos.length > 0) {
        favoritos.pop(); // Simula a remoção de um item
        localStorage.setItem("favoritos", JSON.stringify(favoritos));
    }

    location.reload(); // Atualiza a página após remover um favorito
}

function compartilharWhatsApp() {
    const url = window.location.href;  // URL da página
    const texto = "Confira este conteúdo: ";  // Texto adicional
    const mensagem = encodeURIComponent(texto + url);  // Prepara a mensagem para o WhatsApp

    // URL de compartilhamento do WhatsApp
    const linkWhatsApp = 'https://wa.me/?text=' + mensagem;

    // Abre a URL do WhatsApp em uma nova aba
    window.open(linkWhatsApp, '_blank');
}




// Inicialização
if (window.location.pathname.endsWith('favoritos.html')) {
    exibirFavoritos();
} else {
    carregarCatalogo();
}