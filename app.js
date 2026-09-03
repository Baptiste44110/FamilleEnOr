const app = document.getElementById("app");
const isDisplay = new URLSearchParams(location.search).get("mode") === "display";
const CHANNEL_NAME = "famille-en-or";

const defaultState = {
  screen: "home",

  questionIndex: 0,

  // Réponses révélées pour la question actuelle
  revealed: [],

  lastRevealed: null,

  // Scores des équipes
  scores: [0, 0],

  // Nombre de croix de chaque équipe
  crosses: [0, 0],

  // Équipe qui joue actuellement
  activeTeam: 0,

  // Équipe qui commence la question
  startingTeam: 0,

  multiplier: 1
};

let state = loadState();

const channel = "BroadcastChannel" in window
  ? new BroadcastChannel(CHANNEL_NAME)
  : null;

if (channel) {
  channel.onmessage = (e) => {
    if (e.data?.type === "state") {
      state = e.data.state;
      render();
    }
  };
}

window.addEventListener("storage", (e) => {
  if (e.key === "famille-en-or-state" && e.newValue) {
    state = JSON.parse(e.newValue);
    render();
  }
});


/* =========================================================
   SAUVEGARDE
   ========================================================= */

function loadState() {
  try {
    const saved = JSON.parse(
      localStorage.getItem("famille-en-or-state")
    );

    if (!saved) {
      return structuredClone(defaultState);
    }

    // Compatibilité avec ton ancienne version
    return {
      ...structuredClone(defaultState),
      ...saved,
      crosses: saved.crosses || [0, 0],
      startingTeam: saved.startingTeam ?? 0,
      screen: saved.screen ?? "home"
    };

  } catch {
    return structuredClone(defaultState);
  }
}


function saveState() {
  localStorage.setItem(
    "famille-en-or-state",
    JSON.stringify(state)
  );

  channel?.postMessage({
    type: "state",
    state
  });

  render();
}


/* =========================================================
   QUESTIONS
   ========================================================= */

function currentQuestion() {
  return QUESTIONS[state.questionIndex] || QUESTIONS[0];
}

function rankedAnswers() {

  return [...currentQuestion().answers]
    .sort((a, b) =>
      (Number(b.votes) || 0) -
      (Number(a.votes) || 0)
    );
}

function getTopSix() {

  return rankedAnswers()
    .slice(0, 6);

}


function calculatePoints() {

  const topSix = getTopSix();

  const totalVotes =
    topSix.reduce(
      (sum, a) =>
        sum + (Number(a.votes) || 0),
      0
    );

  if (totalVotes === 0) {
    return [];
  }

  // Calcul exact des points
  const calculated =
    topSix.map((answer, index) => {

      const exact =
        (Number(answer.votes) / totalVotes) * 100;

      return {
        index,
        text: answer.text,
        votes: Number(answer.votes) || 0,
        exact,
        points: Math.floor(exact)
      };

    });

  // Combien de points manquent pour arriver exactement à 100 ?
  let remaining =
    100 -
    calculated.reduce(
      (sum, answer) =>
        sum + answer.points,
      0
    );

  // On donne les points restants
  // aux réponses ayant les plus gros décimaux
  calculated
    .slice()
    .sort(
      (a, b) =>
        (b.exact - Math.floor(b.exact)) -
        (a.exact - Math.floor(a.exact))
    )
    .slice(0, remaining)
    .forEach(answer => {
      calculated[answer.index].points++;
    });

  return calculated;
}

function answerPoints(answer) {

  const topSix =
    calculatePoints();

  const found =
    topSix.find(
      a => a.text === answer.text
    );

  return found
    ? found.points
    : 0;
}


/* =========================================================
   OUTILS
   ========================================================= */

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================================================
   AFFICHAGE
   ========================================================= */

function render() {

  document.body.className = isDisplay
    ? "display-mode"
    : "admin-mode";

  if (state.screen === "home") {
    app.innerHTML = renderHome();
  } else {
    app.innerHTML = isDisplay
      ? renderDisplay()
      : renderAdmin();
  }

  bindEvents();
}


/* =========================================================
   PAGE D'ACCUEIL
   ========================================================= */

function renderHome() {

  return `
    <main class="home">

      <div class="home-card">

        <div class="anniv">
          ANNIVERSAIRE
        </div>

        <h1>
          Alex & Marion
        </h1>

        <div class="subtitle">
          Bienvenue dans
          <strong>Une Famille en Or</strong>
        </div>

        <div class="rules">

          <strong>Deux équipes s'affrontent :</strong><br>

          Team Alex 🆚 Team Marion

          <br><br>

          À tour de rôle, chaque équipe propose
          une réponse à la question.

          <br>

          Une mauvaise réponse donne une
          <strong>✕</strong>.

          <br>

          La première équipe à atteindre
          <strong>2 croix</strong>
          est bloquée.
          
          <br>
          
          L'autre équipe continue de jouer
          jusqu'à atteindre elle aussi
          <strong>2 croix</strong>.

        </div>

        <button
          class="start-btn"
          data-action="start"
        >
          COMMENCER LE JEU
        </button>

      </div>

    </main>
  `;
}


/* =========================================================
   HEADER DU JEU
   ========================================================= */

function renderHeader() {

  return `
    <header class="topbar">

      <div class="logo">
        UNE FAMILLE
        <span>EN OR</span>
      </div>

      <div class="round">
        QUESTION
        ${state.questionIndex + 1}
        /
        ${QUESTIONS.length}
      </div>

    </header>
  `;
}


/* =========================================================
   ÉQUIPE
   ========================================================= */

function renderTeam(team, name) {

  const active =
    state.activeTeam === team
      ? "active"
      : "";

  const cross1 =
    state.crosses[team] >= 1
      ? "on"
      : "";

  const cross2 =
    state.crosses[team] >= 2
      ? "on"
      : "";

  return `
    <div class="team ${active}">

      <div class="team-name">
        ${name}
      </div>

      <div class="score">
        ${state.scores[team]}
      </div>

      <div class="crosses">

        <div class="cross ${cross1}">
          ✕
        </div>

        <div class="cross ${cross2}">
          ✕
        </div>

      </div>

    </div>
  `;
}


/* =========================================================
   ÉCRAN PUBLIC
   ========================================================= */

function renderDisplay() {

  const q = currentQuestion();

 const answers =
  getTopSix();

  return `

    <main class="game">

      <div class="topbar">

        ${renderTeam(0, "TEAM ALEX")}

        <div class="question-box">

          <div class="round-label">
            QUESTION
            ${state.questionIndex + 1}
            /
            ${QUESTIONS.length}
          </div>

          <div class="question">
            ${escapeHtml(q.question)}
          </div>

        </div>

        ${renderTeam(1, "TEAM MARION")}

      </div>


      <div class="answer-board">

        ${
          answers.length

          ?

          answers
            .map((a, i) => {

              const isRevealed =
                state.revealed.includes(i);

              return `

              <div class="answer-row ${
  isRevealed ? "revealed" : ""
} ${
  state.lastRevealed === i
    ? "reveal-animation"
    : ""
}">

                  <div class="answer-text">

                    ${
                      isRevealed
                        ? escapeHtml(a.text)
                        : "?"
                    }

                  </div>

                  <div class="answer-points">

                    ${
                      isRevealed
                        ? a.points
                        : "?"
                    }

                  </div>

                </div>

              `;

            })
            .join("")

          :

          `
            <div class="empty">
              Les réponses seront ajoutées
              après le dépouillement du sondage.
            </div>
          `
        }

      </div>

    </main>
  `;
}


/* =========================================================
   ÉCRAN ANIMATEUR
   ========================================================= */

function renderAdmin() {

  const q = currentQuestion();

  const answers =
  rankedAnswers();

  return `

    <main class="admin">

      <section class="card">

        <div class="eyebrow">
          QUESTION
        </div>

        <h1>
          ${escapeHtml(q.question)}
        </h1>

        <div class="controls">

          <button data-action="prev">
            ← Précédente
          </button>

          <button
            class="primary"
            data-action="next"
          >
            Suivante →
          </button>

        </div>

      </section>


      <!-- RÉPONSES -->

      <section class="card">

        <div class="eyebrow">
          RÉPONSES
        </div>

        <div class="answer-list">

          ${
            answers.length

            ?

            answers
              .map((a, i) => `

                <div
                  class="admin-answer
                  ${
                    state.revealed.includes(i)
                      ? "on"
                      : ""
                  }"
                >

                  <div>

                    <b>
                      #${i + 1}
                      —
                      ${escapeHtml(a.text)}
                    </b>

                    <small>
                      ${a.votes}
                      réponse${a.votes > 1 ? "s" : ""}
                      ·
                      ${answerPoints(a)}
                      points
                    </small>

                  </div>

                  <button
                    data-action="reveal"
                    data-index="${i}"
                  >

                    ${
                      state.revealed.includes(i)
                        ? "Masquer"
                        : "Révéler"
                    }

                  </button>

                </div>

              `)
              .join("")

            :

            `
              <p class="muted">
                Aucune réponse renseignée
                pour le moment.
              </p>
            `
          }

        </div>

      </section>


      <!-- ÉQUIPES -->

      <section class="card">

        <div class="eyebrow">
          ÉQUIPES
        </div>

        <div class="teams">

          ${renderAdminTeam(0, "TEAM ALEX")}

          ${renderAdminTeam(1, "TEAM MARION")}

        </div>


        <div class="controls lower">

          <button
            data-action="wrong"
            class="danger"
          >
            ✕ Mauvaise réponse
          </button>

          <button data-action="resetwrong">
            Réinitialiser les ✕
          </button>

        </div>

      </section>


      <!-- NAVIGATION -->

      <section class="card">

        <div class="eyebrow">
          NAVIGATION
        </div>

        <div class="controls">

          <button data-action="prev">
            ← Question précédente
          </button>

          <button
            data-action="next"
            class="primary"
          >
            Question suivante →
          </button>

        </div>

      </section>


      <!-- RESET -->

      <section class="card">

        <button
          data-action="reset"
          class="danger"
        >
          Réinitialiser toute la partie
        </button>

      </section>


      <section class="hint">

        <b>Écran public :</b>

        ouvre cette même page avec

        <code>?mode=display</code>

        sur la TV ou le projecteur.

        <br>

        Les deux écrans se synchronisent
        automatiquement.

      </section>

    </main>

  `;
}


/* =========================================================
   ÉQUIPE DANS L'ADMIN
   ========================================================= */

function renderAdminTeam(team, name) {

  const active =
    state.activeTeam === team
      ? "active"
      : "";

  return `

    <div class="team ${active}">

      <label>
        ${name}
      </label>

      <div class="big-score">
        ${state.scores[team]}
      </div>


      <div class="crosses">

        <div class="cross ${
          state.crosses[team] >= 1
            ? "on"
            : ""
        }">
          ✕
        </div>

        <div class="cross ${
          state.crosses[team] >= 2
            ? "on"
            : ""
        }">
          ✕
        </div>

      </div>


      <div class="team-buttons">

        <button
          data-action="team"
          data-team="${team}"
        >
          ${active ? "✓ Joue" : "Faire jouer"}
        </button>

        <button
          data-action="add"
          data-team="${team}"
        >
          + points
        </button>

        <button
          data-action="minus"
          data-team="${team}"
        >
          − 5
        </button>

      </div>

    </div>

  `;
}

function updateActiveTeam() {

  // Si les deux équipes ont 2 croix,
  // la manche est terminée.
  if (
    state.crosses[0] >= 2 &&
    state.crosses[1] >= 2
  ) {
    return;
  }

  // Si l'équipe active a déjà 2 croix,
  // elle ne peut plus jouer.
  if (state.crosses[state.activeTeam] >= 2) {

    const otherTeam =
      state.activeTeam === 0 ? 1 : 0;

    // L'autre équipe continue.
    if (state.crosses[otherTeam] < 2) {
      state.activeTeam = otherTeam;
    }
  }
}

/* =========================================================
   ÉVÉNEMENTS
   ========================================================= */

function bindEvents() {

  document
    .querySelectorAll("[data-action]")
    .forEach(btn => {

      btn.addEventListener("click", () => {

        const action =
          btn.dataset.action;


        /* -------------------------
           COMMENCER
        ------------------------- */

        if (action === "start") {

          state.screen = "game";

          state.questionIndex = 0;

          state.revealed = [];

          state.crosses = [0, 0];

          state.scores = [0, 0];

          // Alex commence
          state.startingTeam = 0;

          state.activeTeam = 0;

          saveState();

        }


        /* -------------------------
           RÉVÉLER
        ------------------------- */

        if (action === "reveal") {

  const i =
    Number(btn.dataset.index);

  // Si la réponse est déjà révélée,
  // on ne fait rien.
  if (state.revealed.includes(i)) {
    return;
  }

  // Révéler la réponse
  state.revealed.push(i);

  state.lastRevealed = i;

  // Ajouter les points à l'équipe qui vient de répondre
 const topSix =
  getTopSix();

state.scores[state.activeTeam] +=
  answerPoints(topSix[i]);

  // Changer d'équipe
  const otherTeam =
    state.activeTeam === 0 ? 1 : 0;

  // Si l'autre équipe n'a pas encore 2 croix,
  // elle prend la main.
  if (state.crosses[otherTeam] < 2) {
    state.activeTeam = otherTeam;
  }

  saveState();
}


        /* -------------------------
           MAUVAISE RÉPONSE
        ------------------------- */

       if (action === "wrong") {

  const team = state.activeTeam;

  // Une équipe qui a déjà 2 croix ne peut plus jouer.
  if (state.crosses[team] >= 2) {
    return;
  }

  // Ajouter une croix
  state.crosses[team] =
    Math.min(
      2,
      state.crosses[team] + 1
    );

  const otherTeam =
    team === 0 ? 1 : 0;

  // Si l'équipe vient d'atteindre 2 croix,
  // l'autre équipe prend la main et continue.
  if (state.crosses[team] >= 2) {

    if (state.crosses[otherTeam] < 2) {
      state.activeTeam = otherTeam;
    }

  } else {

    // Sinon, on passe simplement la main à l'autre équipe.
    if (state.crosses[otherTeam] < 2) {
      state.activeTeam = otherTeam;
    }
  }

  saveState();
}

        /* -------------------------
           RESET CROIX
        ------------------------- */

        if (action === "resetwrong") {

          state.crosses = [0, 0];

          saveState();
        }


        /* -------------------------
           CHANGER D'ÉQUIPE
        ------------------------- */

       if (action === "team") {

  const team =
    Number(btn.dataset.team);

  // Une équipe ayant déjà 2 croix
  // ne peut plus reprendre la main.
  if (state.crosses[team] >= 2) {
    return;
  }

  state.activeTeam = team;

  saveState();
}

        /* -------------------------
           AJOUTER DES POINTS
        ------------------------- */

        if (action === "add") {

          const team =
            Number(btn.dataset.team);

          state.scores[team] +=
            totalAvailablePoints();

          saveState();
        }


        /* -------------------------
           RETIRER 5 POINTS
        ------------------------- */

        if (action === "minus") {

          const team =
            Number(btn.dataset.team);

          state.scores[team] =
            Math.max(
              0,
              state.scores[team] - 5
            );

          saveState();
        }


        /* -------------------------
           QUESTION SUIVANTE
        ------------------------- */

        if (action === "next") {

          if (
            state.questionIndex <
            QUESTIONS.length - 1
          ) {

            state.questionIndex++;

            state.revealed = [];

            state.crosses = [0, 0];

            // L'équipe qui commence change
            state.startingTeam =
              state.startingTeam === 0
                ? 1
                : 0;

            state.activeTeam =
              state.startingTeam;

            saveState();
          }
        }


        /* -------------------------
           QUESTION PRÉCÉDENTE
        ------------------------- */

        if (action === "prev") {

          if (
            state.questionIndex > 0
          ) {

            state.questionIndex--;

            state.revealed = [];

            state.crosses = [0, 0];

            state.startingTeam =
              state.startingTeam === 0
                ? 1
                : 0;

            state.activeTeam =
              state.startingTeam;

            saveState();
          }
        }


        /* -------------------------
           ACCUEIL
        ------------------------- */

        if (action === "home") {

          state.screen = "home";

          saveState();
        }


        /* -------------------------
           RESET COMPLET
        ------------------------- */

        if (action === "reset") {

          if (
            confirm(
              "Réinitialiser toute la partie ?"
            )
          ) {

            state =
              structuredClone(
                defaultState
              );

            saveState();
          }
        }

      });

    });
}


render();
