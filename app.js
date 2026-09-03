const app = document.getElementById("app");
const isDisplay = new URLSearchParams(location.search).get("mode") === "display";
const CHANNEL_NAME = "famille-en-or";

const defaultState = {
  questionIndex: 0,
  revealed: [],
  wrong: 0,
  scores: [0, 0],
  activeTeam: 0,
  multiplier: 1
};

let state = loadState();

const channel = "BroadcastChannel" in window ? new BroadcastChannel(CHANNEL_NAME) : null;
if (channel) channel.onmessage = (e) => {
  if (e.data?.type === "state") {
    state = e.data.state;
    render();
  }
};

window.addEventListener("storage", (e) => {
  if (e.key === "famille-en-or-state" && e.newValue) {
    state = JSON.parse(e.newValue);
    render();
  }
});

function loadState() {
  try {
    return JSON.parse(localStorage.getItem("famille-en-or-state")) || structuredClone(defaultState);
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem("famille-en-or-state", JSON.stringify(state));
  channel?.postMessage({ type: "state", state });
  render();
}

function currentQuestion() {
  return QUESTIONS[state.questionIndex] || QUESTIONS[0];
}

function totalAvailablePoints() {
  return currentQuestion().answers.reduce((sum, a) => sum + (Number(a.votes) || 0), 0) * state.multiplier;
}

function answerPoints(answer) {
  // Barème actuel : le nombre de votes devient le nombre de points.
  // On pourra facilement remplacer cette règle ensuite par un barème fixe 30/25/20/15/10/5.
  return (Number(answer.votes) || 0) * state.multiplier;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function render() {
  document.body.className = isDisplay ? "display-mode" : "admin-mode";
  app.innerHTML = isDisplay ? renderDisplay() : renderAdmin();
  bindEvents();
}

function renderHeader() {
  return `
    <header class="topbar">
      <div class="logo">FAMILLE <span>EN OR</span></div>
      <div class="round">QUESTION ${state.questionIndex + 1} / ${QUESTIONS.length}</div>
    </header>
  `;
}

function renderDisplay() {
  const q = currentQuestion();
  const answers = q.answers || [];
  return `
    ${renderHeader()}
    <main class="screen">
      <div class="question">${escapeHtml(q.question)}</div>

      <div class="board">
        ${answers.length
          ? answers.slice(0, 6).map((a, i) => {
              const isRevealed = state.revealed.includes(i);
              return `
                <div class="answer ${isRevealed ? "revealed" : ""}">
                  <span class="rank">${i + 1}</span>
                  <span class="answer-text">${isRevealed ? escapeHtml(a.text) : "••••••••••••"}</span>
                  <span class="votes">${isRevealed ? Number(a.votes) * state.multiplier : ""}</span>
                </div>`;
            }).join("")
          : `<div class="empty">Les réponses seront ajoutées après le dépouillement du sondage.</div>`
        }
      </div>

      <div class="scorebar">
        <div>ÉQUIPE 1 <strong>${state.scores[0]}</strong></div>
        <div>ÉQUIPE 2 <strong>${state.scores[1]}</strong></div>
      </div>

      ${state.wrong ? `<div class="wrong">${"✕".repeat(state.wrong)}</div>` : ""}
    </main>
  `;
}

function renderAdmin() {
  const q = currentQuestion();
  const answers = q.answers || [];
  return `
    ${renderHeader()}
    <main class="admin">
      <section class="card">
        <div class="eyebrow">QUESTION</div>
        <h1>${escapeHtml(q.question)}</h1>
        <div class="controls">
          <button data-action="prev">← Précédente</button>
          <button class="primary" data-action="next">Suivante →</button>
        </div>
      </section>

      <section class="card">
        <div class="eyebrow">RÉPONSES</div>
        <div class="answer-list">
          ${answers.length
            ? answers.slice(0, 6).map((a, i) => `
              <div class="admin-answer ${state.revealed.includes(i) ? "on" : ""}">
                <div>
                  <b>#${i + 1} — ${escapeHtml(a.text)}</b>
                  <small>${a.votes} réponse${a.votes > 1 ? "s" : ""} · ${answerPoints(a)} points</small>
                </div>
                <button data-action="reveal" data-index="${i}">
                  ${state.revealed.includes(i) ? "Masquer" : "Révéler"}
                </button>
              </div>`).join("")
            : `<p class="muted">Aucune réponse renseignée pour le moment.</p>`
          }
        </div>
      </section>

      <section class="card">
        <div class="eyebrow">SCORES</div>
        <div class="teams">
          ${[0,1].map(i => `
            <div class="team ${state.activeTeam === i ? "active" : ""}">
              <label>Équipe ${i + 1}</label>
              <div class="big-score">${state.scores[i]}</div>
              <div class="team-buttons">
                <button data-action="team" data-team="${i}">Joue</button>
                <button data-action="add" data-team="${i}">+ points</button>
                <button data-action="minus" data-team="${i}">−</button>
              </div>
            </div>`).join("")}
        </div>
        <div class="controls lower">
          <button data-action="wrong">✕ Mauvaise réponse</button>
          <button data-action="resetwrong">Réinitialiser les X</button>
          <button data-action="reset">Nouvelle partie</button>
        </div>
      </section>

      <section class="hint">
        <b>Écran public :</b>
        ouvre cette même page avec <code>?mode=display</code> sur la TV/projecteur.
        Les deux écrans se synchronisent automatiquement dans le même navigateur.
      </section>
    </main>
  `;
}

function bindEvents() {
  document.querySelectorAll("[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;

      if (action === "reveal") {
        const i = Number(btn.dataset.index);
        state.revealed = state.revealed.includes(i)
          ? state.revealed.filter(x => x !== i)
          : [...state.revealed, i];
        saveState();
      }

      if (action === "wrong") {
        state.wrong = Math.min(3, state.wrong + 1);
        saveState();
      }

      if (action === "resetwrong") {
        state.wrong = 0;
        saveState();
      }

      if (action === "team") {
        state.activeTeam = Number(btn.dataset.team);
        saveState();
      }

      if (action === "add") {
        state.scores[Number(btn.dataset.team)] += totalAvailablePoints();
        saveState();
      }

      if (action === "minus") {
        const t = Number(btn.dataset.team);
        state.scores[t] = Math.max(0, state.scores[t] - 5);
        saveState();
      }

      if (action === "next") {
        state.questionIndex = Math.min(QUESTIONS.length - 1, state.questionIndex + 1);
        state.revealed = [];
        state.wrong = 0;
        saveState();
      }

      if (action === "prev") {
        state.questionIndex = Math.max(0, state.questionIndex - 1);
        state.revealed = [];
        state.wrong = 0;
        saveState();
      }

      if (action === "reset") {
        if (confirm("Réinitialiser toute la partie ?")) {
          state = structuredClone(defaultState);
          saveState();
        }
      }
    });
  });
}

render();
