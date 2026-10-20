
const SUPABASE_URL = "https://smxjkgcxjzomkqwaaxlr.supabase.co";
const SUPABASE_KEY = "sb_publishable_SaIzHbrr-jTPPnFhztD36w_N6o6vuBX";

// Année automatique dans le pied de page
document.querySelectorAll("[data-year]").forEach(element => {
  element.textContent = new Date().getFullYear();
});

// Menu mobile
const sidebar = document.querySelector(".sidebar");
const menuButton = document.querySelector("[data-menu-toggle]");

if (menuButton && sidebar) {
  menuButton.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  document.addEventListener("click", event => {
    if (
      window.innerWidth <= 700 &&
      sidebar.classList.contains("open") &&
      !sidebar.contains(event.target) &&
      !menuButton.contains(event.target)
    ) {
      sidebar.classList.remove("open");
    }
  });
}

// Protection du texte affiché sur la page
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

// Normalisation des plateformes des jeux
function normalizePlatforms(value) {
  if (Array.isArray(value)) {
    return value.map(String);
  }

  if (value == null || value === "") {
    return [];
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.map(String);
      }
    } catch (_) {}

    return value
      .split(",")
      .map(platform => platform.trim())
      .filter(Boolean);
  }

  return [String(value)];
}

// Vérification des liens des jeux
function safeURL(value) {
  try {
    const url = new URL(String(value || ""));

    if (["https:", "http:"].includes(url.protocol)) {
      return url.href;
    }
  } catch (_) {}

  return "";
}

// Catalogue des jeux : uniquement sur Explorer
const gamesGrid = document.getElementById("gamesGrid");

if (gamesGrid) {
  const status = document.getElementById("gameStatus");
  const search = document.getElementById("gameSearch");
  let allGames = [];

  function renderGames(games) {
    if (!games.length) {
      gamesGrid.innerHTML = "";

      status.textContent = allGames.length
        ? "Aucun jeu ne correspond à ta recherche."
        : "Aucun jeu publié trouvé.";

      status.classList.remove("error");
      return;
    }

    status.classList.remove("error");
    status.textContent = `${games.length} jeu(x) affiché(s).`;

    gamesGrid.innerHTML = games.map(game => {
      const tags = [
        game.genre || "Jeu vidéo",
        ...normalizePlatforms(game.platforms)
      ]
        .filter(Boolean)
        .map(platform =>
          `<span class="tag">${escapeHTML(platform)}</span>`
        )
        .join("");

      const url = safeURL(game.official_url);

      const link = url
        ? `<a class="btn primary" style="width:100%;margin-top:12px"
             href="${escapeHTML(url)}"
             target="_blank"
             rel="noopener noreferrer">
             Site officiel ↗
           </a>`
        : `<p class="muted">Lien officiel non renseigné.</p>`;

      return `
        <article class="card">
          <div class="game-icon">🎮</div>
          <h3>${escapeHTML(game.title || "Jeu sans titre")}</h3>
          <p>${escapeHTML(
            game.description || "Découvre ce jeu dans NOVARA."
          )}</p>
          <div class="tags">${tags}</div>
          ${link}
        </article>
      `;
    }).join("");
  }

  async function loadGames() {
    status.classList.remove("error");
    status.textContent = "Connexion à Supabase…";

    try {
      const base = new URL(SUPABASE_URL);

      const endpoint =
        base.href.replace(/\/$/, "") +
        "/rest/v1/games?select=id,title,genre,platforms,official_url,description,is_published&is_published=eq.true&order=title.asc";

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      });

      if (!response.ok) {
        const body = await response.text();

        throw new Error(
          `HTTP ${response.status}. ${body.slice(0, 300)}`
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error(
          "La réponse de Supabase n'est pas une liste."
        );
      }

      allGames = data;
      renderGames(allGames);

    } catch (error) {
      console.error("NOVARA / Supabase :", error);

      gamesGrid.innerHTML = "";

      status.textContent =
        "Erreur de chargement : " +
        (error.message || "connexion impossible");

      status.classList.add("error");
    }
  }

  // Recherche instantanée
  if (search) {
    search.addEventListener("input", () => {
      const query = search.value
        .trim()
        .toLocaleLowerCase("fr");

      const filtered = allGames.filter(game => {
        const text = [
          game.title,
          game.genre,
          game.description,
          ...normalizePlatforms(game.platforms)
        ]
          .join(" ")
          .toLocaleLowerCase("fr");

        return text.includes(query);
      });

      renderGames(filtered);
    });
  }

  loadGames();
}
