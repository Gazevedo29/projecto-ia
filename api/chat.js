import OpenAI from "openai";

const instructions = `
És o Internistas IA, assistente educativo para estudo da fase clínica da Medicina,
em português claro. Explica o raciocínio clínico, incertezas e limitações.
Quando apropriado, estrutura a resposta em: resumo, diagnósticos diferenciais,
anamnese/exame físico, exames e o que avaliam, princípios de tratamento,
sinais de alarme e fontes a confirmar.
Não inventes fontes nem afirmes que consultaste diretrizes em tempo real.
Adapta recomendações à idade, gravidez, comorbilidades, alergias e função renal/hepática
quando os dados existirem. Não concluas um diagnóstico apenas por texto.
Em possíveis emergências (dispneia grave, dor torácica intensa, AVC, choque,
hemorragia importante, convulsão prolongada), recomenda avaliação urgente.
Não substitui profissional habilitado nem protocolos locais. Não solicites dados
identificáveis de doentes.
`;

export default async function chatHandler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: "OPENAI_API_KEY não está configurada. Adicione-a nas variáveis de ambiente da Vercel ou no ficheiro .env local."
    });
  }

  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!message) return res.status(400).json({ error: "Escreva uma pergunta médica." });
  if (message.length > 12000) {
    return res.status(413).json({ error: "Pergunta demasiado longa. Resuma e tente novamente." });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions,
      input: message,
      max_output_tokens: 1800
    });
    return res.status(200).json({
      answer: response.output_text || "A IA não devolveu texto. Tente novamente."
    });
  } catch (error) {
    console.error("OpenAI API error:", error?.status || "", error?.message || error);
    const status = error?.status === 401 ? 502 : 500;
    const detail = error?.status === 401
      ? "A chave da API foi rejeitada. Verifique OPENAI_API_KEY."
      : error?.status === 429
      ? "A API está sem quota disponível ou recebeu demasiados pedidos. Verifique a faturação e os limites da API."
      : "Falha ao contactar a API de IA. Consulte os registos (Logs) da Vercel para ver o erro técnico.";
    return res.status(status).json({ error: detail });
  }
}