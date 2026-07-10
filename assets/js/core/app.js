/**
 * CineMaxBR Admin Portal - Core Engine Otimizado
 */
import { subscribeToMedia, subscribeToOldMovies, subscribeToFranchises } from '../services/firebase-service.js';
import { state, updateMedia, updateFranchises } from './state.js';
import { showTab } from './navigation.js';
import { initMediaForm, setMediaTypeUI, handleSaveMedia, addSeason, handleTMDBFetch } from '../components/media-form.js';
import { renderCatalog, filterList, selectAll, handleDeleteBulk } from '../components/catalog-renderer.js';
import { renderFranchises, handleSaveFranchise } from '../components/franchise-manager.js';
import { showVideoPreview, analyzeLinkType, showAnalysis } from '../utils/dom-helper.js';
import { initDashboard, updateDashboardStats } from '../components/dashboard.js';
import { initAccessManager } from '../components/access-manager.js';
import { showToast } from '../components/toast.js';

// Inicialização Global
document.addEventListener('DOMContentLoaded', () => {
    window.showToast = showToast;

    try {
        initAppFlow();
        attachGlobalListeners();

        // Tab inicial segura
        showTab('dashboard');
    } catch (error) {
        console.error("Erro crítico na inicialização do Admin:", error);
        showToast("Erro ao carregar painel. Verifique o console.", "danger");
    }
});

/**
 * Gerenciamento de Fluxo de Dados com Redução de Overload
 */
function initAppFlow() {
    // Subscreve ao Media (Novo e Antigo) com debouncing implícito pela renderização do estado
    subscribeToMedia((data) => {
        updateMedia(data, false);
        refreshUI();
    });

    subscribeToOldMovies((data) => {
        updateMedia(data, true);
        refreshUI();
    });

    subscribeToFranchises((franchises) => {
        updateFranchises(franchises);
        renderFranchises();
    });

    // Inits de Componentes
    initMediaForm();
    initDashboard();
    initAccessManager();
}

/**
 * Atualização Centralizada da UI
 */
function refreshUI() {
    renderCatalog();
    renderFranchises();
    updateDashboardStats();
}

/**
 * Listeners Globais Otimizados
 */
function attachGlobalListeners() {
    // Delegação de eventos para Navegação
    document.querySelectorAll('.nav-link, .nav-item').forEach(nav => {
        const tabId = nav.getAttribute('data-tab');
        if (tabId) {
            nav.addEventListener('click', (e) => {
                e.preventDefault();
                showTab(tabId, e);
            });
        }
    });

    // Controles de Formulário
    const btnM = document.getElementById('typeM');
    const btnS = document.getElementById('typeS');
    if (btnM) btnM.onclick = () => setMediaTypeUI('movie');
    if (btnS) btnS.onclick = () => setMediaTypeUI('series');

    // Previews de Mídia
    const btnPrevTrailer = document.getElementById('btnPreviewTrailer');
    const btnPrevVideo = document.getElementById('btnPreviewVideo');
    const btnAnalyze = document.getElementById('btnAnalyzeLink');

    if (btnPrevTrailer) {
        btnPrevTrailer.onclick = () => {
            const val = document.getElementById('mTrailer')?.value;
            if (val) showVideoPreview('trailerPreview', val);
        };
    }

    if (btnPrevVideo) {
        btnPrevVideo.onclick = () => {
            const val = document.getElementById('mUrl')?.value;
            if (val) showVideoPreview('videoPreview', val);
        };
    }

    if (btnAnalyze) {
        btnAnalyze.onclick = () => {
            const url = document.getElementById('mUrl')?.value;
            if (url) {
                const analysis = analyzeLinkType(url);
                showAnalysis('analysisResult', analysis);
            }
        };
    }

    // Ações de Salvar e TMDB
    document.getElementById('btnSaveMedia').onclick = handleSaveMedia;
    document.getElementById('btnSaveFranchise').onclick = handleSaveFranchise;
    document.getElementById('btnFetchTMDB').onclick = handleTMDBFetch;

    const btnAddSeason = document.getElementById('btnAddSeason');
    if (btnAddSeason) btnAddSeason.onclick = addSeason;

    // Busca e Ações em Massa no Catálogo
    const searchInput = document.getElementById('search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => filterList(e.target.value));
    }

    const checkAll = document.getElementById('selectAll');
    if (checkAll) {
        checkAll.onchange = (e) => selectAll(e.target.checked);
    }

    const btnDeleteBulk = document.getElementById('btnDeleteBulk');
    if (btnDeleteBulk) {
        btnDeleteBulk.onclick = handleDeleteBulk;
    }
}
