const form = document.querySelector("#chatForm");
const input = document.querySelector("#message");
const chat = document.querySelector("#chat");
const welcome = document.querySelector("#welcome");
const sendButton = document.querySelector("#sendButton");
const newChat = document.querySelector("#newChat");

function addMessage(role, text, isError = false) {
  const row = document.createElement("div");
  row.className = "message-row";
  const avatar = document.createElement("div");
  avatar.className = `avatar ${role === "user" ? "user-avatar" : ""}`;
  avatar.textContent = role === "user" ? "U" : "+";
  const body = document.createElement("div");
  body.className = "message-body";
  if (isError) body.classList.add("error");
  const label = document.createElement("div");
  label.className = "message-label";
  label.textContent = role === "user" ? "A sua pergunta" : "Internistas IA";
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  body.append(label, paragraph);
  row.append(avatar, body);
  chat.append(row);
  row.scrollIntoView({ behavior: "smooth", block: "start" });
  return paragraph;
}

async function ask(question) {
  const cleaned = question.trim();
  if (!cleaned || sendButton.disabled) return;
  welcome.hidden = true;
  addMessage("user", cleaned);
  input.value = "";
  input.style.height = "auto";
  sendButton.disabled = true;
  sendButton.textContent = "…";
  const answerElement = addMessage("assistant", "A contactar a IA…");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ message: cleaned })
    });

    const raw = await response.text();
    let data;
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      throw new Error(`O servidor devolveu uma resposta inválida (HTTP ${response.status}). Verifique os registos da Vercel.`);
    }

    if (!response.ok) {
      throw new Error(data.error || `Erro do servidor (HTTP ${response.status}). Verifique as variáveis de ambiente e os Logs da Vercel.`);
    }
    if (!data.answer) {
      throw new Error(data.error || "O servidor respondeu, mas não enviou texto. Consulte os Logs da Vercel.");
    }
    answerElement.textContent = data.answer;
  } catch (error) {
    answerElement.textContent = error.message || "Não foi possível contactar a IA.";
    answerElement.parentElement.classList.add("error");
  } finally {
    sendButton.disabled = false;
    sendButton.textContent = "↑";
    input.focus();
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  ask(input.value);
});
input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 180)}px`;
});
document.querySelectorAll("[data-prompt]").forEach((button) => {
  button.addEventListener("click", () => ask(button.dataset.prompt));
});
newChat.addEventListener("click", () => {
  chat.replaceChildren();
  welcome.hidden = false;
  input.value = "";
  input.focus();
});