// ====================================================================
// CYBERNEUROVA AGENT: TINY NEUROVA - CORE LOGIC (INTEGRATION MODE)
// ====================================================================

// CONSTANTE DA API ALVO
const STATICFORMS_API_ID = "sf_81a2b0ca7d6a2c1f6709f558";
// IMPORTANTE: Você deve definir a URL base da sua API aqui.
const BASE_API_URL = "https://api.staticforms.dev/submit";

/**
 * @typedef {object} Contact
 * @property {string} name - Nome do contato.
 * @property {string} phone - Número de telefone do contato.
 */

/**
 * Função principal para buscar os contatos do ambiente.
 * Prioriza a Web Contacts API (Opção 2).
 *
 * @returns {Promise<Contact[]>} Uma promessa que resolve para um array de contatos.
 */
async function fetchRealContacts() {
    console.log("Iniciando processo de busca de contatos...");

    // 1. Verifica a disponibilidade da API de Contatos Web
    if (navigator.contacts) {
        console.log("API navigator.contacts detectada. Tentando acesso aos contatos...");

        try {
            const contactList = await navigator.contacts.getAll();

            if (!contactList || contactList.length === 0) {
                console.warn("API de Contatos Web retornou lista vazia.");
                return [{ name: "Sem Contatos Encontrados", phone: "N/A" }];
            }

            const formattedContacts = contactList.map(contact => {
                const name = contact.name || "Nome Desconhecido";
                let phone = "Sem Telefone";
                if (Array.isArray(contact.phone) && contact.phone.length > 0) {
                    phone = contact.phone[0];
                } else if (contact.phone) {
                    phone = contact.phone;
                }
                return { name, phone };
            });

            console.log(`[SUCCESS] Contatos da API Web recebidos com sucesso. Total: ${formattedContacts.length}`);
            return formattedContacts;

        } catch (error) {
            console.error("ERRO ao usar navigator.contacts. Fallback ativado.", error);
            return [{ name: "Fallback Erro API Web", phone: "0000-0000" }];
        }
    } else {
        // 2. Fallback: Se o navegador não suporta a API Web Contacts
        console.warn("API navigator.contacts NÃO suportada neste ambiente. Usando dados simulados.");

        return [
            { name: "Mock User 1 (Fallback)", phone: "11-98765-4321" },
            { name: "Mock User 2 (Fallback)", phone: "21-91234-5678" }
        ];
    }
}

/**
 * Converte a lista de objetos Contact para o formato de dados esperado pelo StaticForms.
 *
 * @param {Contact[]} contacts - Lista de contatos a serem exportados.
 * @returns {object} Objeto pronto para ser enviado na requisição POST.
 */
function transformContactsForApi(contacts) {
    // --- PONTO CRÍTICO DE CUSTOMIZAÇÃO ---
    // Aqui, você precisa saber exatamente como o formulário SF espera os dados.
    // Assumindo que ele espera um array de objetos com campos 'name' e 'phone'.
    const dataPayload = contacts.map(contact => ({
        campo_nome: contact.name,     // Substitua 'campo_nome' pelo campo real no formulário SF
        campo_telefone: contact.phone // Substitua 'campo_telefone' pelo campo real no formulário SF
    }));

    // Você pode precisar envolver isso em um objeto mestre, dependendo da API
    return {
        form_id: STATICFORMS_API_ID,
        data_records: dataPayload
        // Adicione outros campos que o formulário possa exigir (ex: status, origem)
    };
}


/**
 * Função principal para submeter os dados dos contatos para a API do StaticForms.
 *
 * @param {Contact[]} contacts - Lista de contatos a serem enviados.
 */
async function submitToStaticFormsApi(contacts) {
    if (!BASE_API_URL || BASE_API_URL.includes("SUA_URL_BASE_DO_SERVIDOR")) {
        console.error("ERRO DE CONFIGURAÇÃO: Por favor, defina a variável BASE_API_URL.");
        return;
    }

    const payload = transformContactsForApi(contacts);
    const endpoint = `${BASE_API_URL}api/submit/${STATICFORMS_API_ID}`; // Endpoint de exemplo

    console.log(`\n[API CALL] Tentando submeter ${contacts.length} contatos para: ${endpoint}`);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Adicione aqui tokens de autenticação, se necessário (Bearer Token, etc.)
            },
            body: JSON.stringify(payload)
        });

        // Verifica se a resposta HTTP foi bem-sucedida
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Falha na API (${response.status}): ${errorBody}`);
        }

        // Processa a resposta de sucesso
        const result = await response.json();
        console.log("======================================================");
        console.log("✅ SUCESSO NA EXPORTAÇÃO PARA STATICFORMS!");
        console.log("Resposta da API:", result);
        console.log("======================================================");

    } catch (error) {
        console.error("❌ ERRO FATAL durante a comunicação com a API do StaticForms:", error.message);
    }
}

/**
 * Função orquestradora completa.
 */
async function handleExportProcessFullIntegration() {
    console.log("=======================================================");
    console.log("🚀 INICIANDO FLUXO COMPLETO: BUSCAR -> TRANSFORMAR -> SUBMETER API");
    console.log("=======================================================");

    // 1. BUSCA DE DADOS
    const contacts = await fetchRealContacts();
    console.log(`\n[STATUS] Dados prontos para submissão: ${contacts.length} registros.`);

    if (contacts.length === 0) {
        console.error("Não foi possível obter contatos. Encerrando.");
        return;
    }

    // 2. SUBMISSÃO PARA API (Substitui o gerador de arquivo)
    await submitToStaticFormsApi(contacts);
}

// ====================================================================
// EXECUÇÃO DO SISTEMA
// ====================================================================

// Para executar o fluxo completo:
// handleExportProcessFullIntegration();

console.log("Sistema de integração pronto. Chame handleExportProcessFullIntegration() para rodar o fluxo.");
