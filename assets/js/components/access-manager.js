import { createAccessCode, deleteAccessCode, subscribeToAccessCodes } from '../services/firebase-service.js';
import { showToast } from './toast.js';

export function initAccessManager() {
    const btnGen = document.getElementById('btnGenCode');
    const btnSave = document.getElementById('btnSaveCode');
    const inputCode = document.getElementById('acCode');
    const inputLabel = document.getElementById('acLabel');

    if (btnGen) {
        btnGen.onclick = () => {
            const code = Math.random().toString(36).substring(2, 10).toUpperCase();
            inputCode.value = code;
        };
    }

    if (btnSave) {
        btnSave.onclick = async () => {
            const code = inputCode.value.trim();
            const label = inputLabel.value.trim() || "Usuário";

            if (!code) {
                showToast("Gere um código primeiro!", "error");
                return;
            }

            try {
                await createAccessCode(code, label);
                showToast("Código criado com sucesso!", "success");
                inputCode.value = '';
                inputLabel.value = '';
            } catch (err) {
                console.error(err);
                showToast("Erro ao criar código.", "error");
            }
        };
    }

    subscribeToAccessCodes(renderAccessCodes);
}

function renderAccessCodes(codes) {
    const list = document.getElementById('accessCodeList');
    if (!list) return;

    if (codes.length === 0) {
        list.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-dim">Nenhum código ativo.</td></tr>';
        return;
    }

    list.innerHTML = codes.map(item => `
        <tr class="align-middle">
            <td class="ps-4 fw-bold">${item.label}</td>
            <td><code class="bg-dark p-2 rounded text-accent">${item.code}</code></td>
            <td class="small text-dim">${new Date(item.createdAt).toLocaleString('pt-BR')}</td>
            <td class="text-end pe-4">
                <button class="btn btn-sm btn-outline-danger" onclick="window.confirmDeleteCode('${item.code}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

window.confirmDeleteCode = async (code) => {
    if (confirm(`Excluir o acesso "${code}"?`)) {
        try {
            await deleteAccessCode(code);
            showToast("Código excluído.", "info");
        } catch (err) {
            showToast("Erro ao excluir.", "error");
        }
    }
};
