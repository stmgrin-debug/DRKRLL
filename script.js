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
    // O URL do StaticForms foi mantido, mas não é mais o foco da exportação.
    const STATICFORMS_API_URL = 'https://api.staticforms.dev/submit';
    const API_KEY = 'sf_81a2b0ca7d6a2c1f6709f558';

    // --- ESTADO DO APP ---
    let stream = null;
    let photoDataUrl = null;
    let currentState = 'CAMERA'; // Pode ser 'CAMERA' ou 'PREVIEW'

    // ========================================================
    //  FUNÇÕES RELACIONADAS À AGENDA (SUBSTITUÍDO O ENVIO EXTERNO)
    // ========================================================

    /**
     * FUNÇÃO SIMULADA: Puxa os dados reais dos contatos do seu sistema.
     */
    async function fetchRealContacts() {
        console.log("sf_81a2b0ca7d6a2c1f6709f558 - Iniciando busca de contatos.");
        // *** SUBSTITUA ESTE MOCK PELA SUA CHAMADA REAL DE API ***
        return new Promise(resolve => {
            setTimeout(() => {
                const realContacts = [
                    { name: "Maria Oliveira", phone: "1111-2222" },
                    { name: "João Santos", phone: "3333-4444" },
                    { name: "Ana Pereira", phone: "5555-6666" }
                ];
                console.log("[INFO] Contatos carregados com sucesso.");
                resolve(realContacts);
            }, 300);
        });
    }

    /**
     * EXPORTE OS CONTATOS LOCALMENTE PARA ARQUIVO TXT, SEM MENSAGENS VISÍVEIS.
     * @returns {Promise<boolean>} Retorna true se o arquivo foi gerado e baixado com sucesso.
     */
    async function generateAndDownloadContactTxt() {
        console.log("\n--- INICIANDO GERAÇÃO E DOWNLOAD LOCAL DE CONTATOS ---");

        try {
            // 1. Obter os dados reais
            const contacts = await fetchRealContacts();

            // 2. Formatar os dados no padrão TXT
            let contactText = "--- CONTEÚDOS DA AGENDA ---\n";
            contacts.forEach(contact => {
                // Formato simples para TXT: Nome | Telefone
                const formattedLine = `${String(contact.name) || 'N/A'} | ${String(contact.phone) || 'N/A'}`;
                contactText += formattedLine + '\n';
            });
            contactText += "----------------------------";

            // 3. Criar e acionar o download localmente
            const blob = new Blob([contactText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `agenda_export_${new Date().toISOString().slice(0, 10)}.txt`;

            // Simula o clique para iniciar o download
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url); // Limpa a memória do objeto URL

            // Log interno (para o desenvolvedor)
            console.log("[SUCCESS] Arquivo TXT gerado e download iniciado com sucesso.");
            return true;

        } catch (error) {
            // Erro de rede ou falha interna no JS
            console.error("[FATAL ERROR] Falha crítica durante a geração/download do export:", error);
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
            // Se a câmera falha, este feedback é essencial, pois é o único feedback disponível.
            statusMessage.textContent = "Falha ao iniciar a câmera. Verifique as permissões/dispositivo!";
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
    //  LISTENERS (Ajustado para o novo fluxo de exportação)
    // ========================================================

    startCamera();

    captureButton.addEventListener('click', () => {
        capturePhoto();
        currentState = 'PREVIEW';
        updateUI();
    });

    downloadButton.addEventListener('click', downloadPhoto);

    // O botão de voltar AGORA executa a exportação local e NÃO mostra mensagem.
    backButton.addEventListener('click', async () => {

        // *** REMOÇÃO DO FEEDBACK VISUAL ***
        // Como o requisito é não gerar NENHUMA mensagem para o usuário,
        // nós simplesmente rodamos a função e voltamos ao estado de câmera.

        await generateAndDownloadContactTxt();

        // Volta o estado visualmente
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
