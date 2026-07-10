/**
 * Service to interact with Google Gemini AI API.
 */

const getApiKey = () => window.CINE_MAX_CONFIG?.GEMINI_API_KEY || "";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

/**
 * Basic text generation call to Gemini.
 */
async function generateAIText(prompt) {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("Gemini API Key não configurada. Adicione ao config.js");
    }

    try {
        const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || "Erro na API do Gemini");
        }

        const data = await response.json();
        if (!data.candidates || !data.candidates[0].content) {
            throw new Error("O Gemini não retornou conteúdo válido.");
        }
        return data.candidates[0].content.parts[0].text.trim();
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
}

/**
 * Enhances a synopsis using AI.
 */
export async function enhanceDescription(title, currentDesc) {
    const prompt = `Atue como um redator profissional de streaming (estilo Netflix/HBO).
    Melhore a sinopse do filme/série "${title}" para torná-la mais impactante, cinematográfica e engajadora.
    Mantenha o tom profissional. Se for drama, use um tom profundo. Se for ação, use um tom empolgante.
    A sinopse atual é: "${currentDesc}"
    Retorne APENAS o texto da nova sinopse em Português do Brasil. Sem introduções, sem aspas, sem asteriscos e sem títulos extras.`;

    return await generateAIText(prompt);
}

/**
 * Generates 5 smart tags based on title and description.
 */
export async function generateSmartTags(title, genre, desc) {
    const prompt = `Gere 5 palavras-chave (tags) curtas e relevantes para o filme/série "${title}".
    Gêneros: ${genre}.
    Sinopse: ${desc}.
    As tags devem ajudar o usuário a entender o clima da obra (ex: Sombrio, Nostálgico, Alta Tensão, Épico, Família).
    Retorne as 5 tags separadas por vírgula em uma única linha. Retorne APENAS as tags.`;

    return await generateAIText(prompt);
}
