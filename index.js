const venom = require("venom-bot");
const { IamAuthenticator } = require("ibm-watson/auth");
const AssistantV2 = require("ibm-watson/assistant/v2");
require("dotenv").config();

// Configuração do IBM Watson Assistant
const assistantId = process.env.ASSISTANT_ID; // Substitua pelo ID do seu assistente no IBM Watson
const apiKey = process.env.API_KEY; // Substitua pela sua API Key do IBM Watson
const serviceUrl = process.env.SERVICE_URL; // URL do serviço

// Autenticação no IBM Watson
const authenticator = new IamAuthenticator({
  apikey: apiKey,
});
const assistant = new AssistantV2({
  version: "2021-11-27", // Versão da API
  authenticator: authenticator,
  serviceUrl: serviceUrl,
});

let sessionId;

// Função para criar uma sessão com o IBM Watson
async function createSession() {
  try {
    const session = await assistant.createSession({
      assistantId: assistantId,
    });
    sessionId = session.result.session_id;
    console.log("Sessão criada com sucesso:", sessionId);
  } catch (err) {
    console.error("Erro ao criar sessão:", err);
  }
}

// Função para enviar mensagem ao IBM Watson
async function sendMessageToWatson(message) {
  if (!sessionId) {
    await createSession();
  }

  try {
    const response = await assistant.message({
      assistantId: assistantId,
      sessionId: sessionId,
      input: {
        message_type: "text",
        text: message,
      },
    });

    return response.result.output.generic[0].text; // Retorna a resposta do Watson
  } catch (err) {
    console.error("Erro ao enviar mensagem para o Watson:", err);
    return "Desculpe, ocorreu um erro ao processar sua solicitação.";
  }
}

// Inicialização do Venom-bot (WhatsApp)
venom
  .create()
  .then((client) => start(client))
  .catch((erro) => {
    console.log(erro);
  });

function start(client) {
  client.onMessage(async (message) => {
    if (message.body && message.isGroupMsg === false) {
      console.log(`Mensagem recebida de ${message.from}: ${message.body}`);

      // Envia a mensagem para o IBM Watson
      const watsonResponse = await sendMessageToWatson(message.body);

      // Responde ao usuário no WhatsApp
      client.sendText(message.from, watsonResponse);
    }
  });
}
