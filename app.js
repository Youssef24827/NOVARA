
const SUPABASE_URL = "https://smxjkgcxjzomkqwaaxlr.supabase.co";
const SUPABASE_KEY = "sb_publishable_SaIzHbrr-jTPPnFhztD36w_N6o6vuBX";

// Année automatique
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

// Sécuriser le texte affiché dans le HTML
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

// Normaliser les plateformes
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

// Autoriser uniquement les liens HTTP et HTTPS
function safeURL(value) {
  try {
    const url = new URL(String(value || ""));

    if (["https:", "http:"].includes(url.protocol)) {
      return url.href;
    }
  } catch (_) {}

  return "";
}

// ==========================================
// PHOTO DE PROFIL ET AVATARS
// ==========================================

const AVATAR_STORAGE_KEY = "novara_profile_avatar";
const DEFAULT_AVATAR = "🎮";

const avatarFileInput = document.getElementById("avatarFileInput");
const uploadAvatarButton = document.getElementById("uploadAvatarButton");
const resetAvatarButton = document.getElementById("resetAvatarButton");
const avatarImage = document.getElementById("avatarImage");
const avatarEmoji = document.getElementById("avatarEmoji");
const avatarStatus = document.getElementById("avatarStatus");
const avatarOptions = document.querySelectorAll("[data-avatar]");

function showAvatar(avatar) {
  if (!avatarImage || !avatarEmoji) return;

  if (avatar && avatar.type === "image" && avatar.value) {
    avatarImage.src = avatar.value;
    avatarImage.hidden = false;
    avatarEmoji.hidden = true;
  } else {
    avatarImage.removeAttribute("src");
    avatarImage.hidden = true;
    avatarEmoji.hidden = false;
    avatarEmoji.textContent =
      avatar && avatar.type === "emoji"
        ? avatar.value
        : DEFAULT_AVATAR;
  }

  avatarOptions.forEach(button => {
    const selected =
      avatar &&
      avatar.type === "emoji" &&
      button.dataset.avatar === avatar.value;

    button.classList.toggle("selected", Boolean(selected));
    button.setAttribute("aria-pressed", String(Boolean(selected)));
  });
}

function saveAvatar(avatar) {
  try {
    localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(avatar));
    showAvatar(avatar);

    if (avatarStatus) {
      avatarStatus.textContent = "Ton avatar a été enregistré sur ce navigateur.";
      avatarStatus.classList.remove("error");
    }

    return true;
  } catch (error) {
    console.error("NOVARA : impossible d'enregistrer l'avatar.", error);

    if (avatarStatus) {
      avatarStatus.textContent =
        "Impossible d'enregistrer cette image. Choisis une image plus petite.";
      avatarStatus.classList.add("error");
    }

    return false;
  }
}

function loadAvatar() {
  try {
    const stored = localStorage.getItem(AVATAR_STORAGE_KEY);

    if (stored) {
      const avatar = JSON.parse(stored);

      if (
        avatar &&
        avatar.type === "emoji" &&
        typeof avatar.value === "string"
      ) {
        showAvatar(avatar);
        return;
      }

      if (
        avatar &&
        avatar.type === "image" &&
        typeof avatar.value === "string" &&
        avatar.value.startsWith("data:image/")
      ) {
        showAvatar(avatar);
        return;
      }
    }
  } catch (error) {
    console.warn("NOVARA : avatar sauvegardé illisible.", error);
  }

  showAvatar({ type: "emoji", value: DEFAULT_AVATAR });
}

if (avatarFileInput && avatarImage && avatarEmoji) {
  if (uploadAvatarButton) {
    uploadAvatarButton.addEventListener("click", () => {
      avatarFileInput.click();
    });
  }

  avatarFileInput.addEventListener("change", () => {
    const file = avatarFileInput.files && avatarFileInput.files[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif"
    ];

    if (!allowedTypes.includes(file.type)) {
      avatarStatus.textContent =
        "Format non accepté. Choisis une image JPG, PNG, WEBP ou GIF.";
      avatarStatus.classList.add("error");
      avatarFileInput.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      avatarStatus.textContent =
        "L'image dépasse 2 Mo. Choisis une image plus légère.";
      avatarStatus.classList.add("error");
      avatarFileInput.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (
        typeof result !== "string" ||
        !result.startsWith("data:image/")
      ) {
        avatarStatus.textContent = "Impossible de lire cette image.";
        avatarStatus.classList.add("error");
        return;
      }

      saveAvatar({
        type: "image",
        value: result
      });

      avatarFileInput.value = "";
    };

    reader.onerror = () => {
      avatarStatus.textContent = "Erreur lors de la lecture de l'image.";
      avatarStatus.classList.add("error");
      avatarFileInput.value = "";
    };

    reader.readAsDataURL(file);
  });

  avatarOptions.forEach(button => {
    button.addEventListener("click", () => {
      saveAvatar({
        type: "emoji",
        value: button.dataset.avatar || DEFAULT_AVATAR
      });
    });
  });

  if (resetAvatarButton) {
    resetAvatarButton.addEventListener("click", () => {
      try {
        localStorage.removeItem(AVATAR_STORAGE_KEY);
        showAvatar({ type: "emoji", value: DEFAULT_AVATAR });

        avatarStatus.textContent = "Avatar réinitialisé.";
        avatarStatus.classList.remove("error");
      } catch (error) {
        avatarStatus.textContent =
          "Impossible de réinitialiser l'avatar.";
        avatarStatus.classList.add("error");
      }
    });
  }

  loadAvatar();
}

// ==========================================
// CATALOGUE DE JEUX : SUPABASE
// ==========================================


/* ==========================================
   NOVARA — RECHERCHE DE JEUX RAWG
   Remplace l'ancien bloc catalogue.
========================================== */

// Ajoute ta clé RAWG ici pour tester.
// Attention : une clé dans le navigateur est visible publiquement.
const RAWG_API_KEY = "COLLE_TA_CLE_RAWG_ICI";

const gamesGrid = document.getElementById("gamesGrid");

if (gamesGrid) {
  const search = document.getElementById("gameSearch");
  const statusFilter = document.getElementById("gameStatus");
  const statusMessage = document.getElementById("gamesStatus");

  let requestNumber = 0;
  let searchTimer;

  function setStatus(message, isError = false) {
    if (!statusMessage) return;
    statusMessage.textContent = message;
    statusMessage.classList.toggle("error", isError);
  }

  function safeImageURL(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" ? url.href : "";
    } catch {
      return "";
    }
  }

  function platformNames(game) {
    return (game.platforms || [])
      .map(item => item.platform?.name)
      .filter(Boolean);
  }

  function renderGames(games) {
    if (!games.length) {
      gamesGrid.innerHTML = "";
      setStatus("Aucun jeu trouvé. Essaie un autre nom.");
      return;
    }

    gamesGrid.innerHTML = games.map(game => {
      const image = safeImageURL(game.background_image);
      const platforms = platformNames(game);
      const genres = (game.genres || [])
        .map(genre => genre.name)
        .filter(Boolean);

      const tags = [...genres, ...platforms]
        .slice(0, 6)
        .map(name => `<span class="tag">${escapeHTML(name)}</span>`)
        .join("");

      const releaseDate = game.released
        ? `<p class="game-release">Sortie : ${escapeHTML(game.released)}</p>`
        : "";

      const rating = Number.isFinite(game.rating) && game.rating > 0
        ? `<p class="game-rating">Note RAWG : ${escapeHTML(game.rating)} / 5</p>`
        : "";

      const officialPage = safeURL(game.website);
      const rawgPage = safeURL(game.url);

      const link = rawgPage
        ? `<a class="btn primary game-link"
             href="${escapeHTML(rawgPage)}"
             target="_blank"
             rel="noopener noreferrer">
             Voir la fiche du jeu ↗
           </a>`
        : "";

      return `
        <article class="card game-result">
          ${
            image
              ? `<img class="game-cover"
                   src="${escapeHTML(image)}"
                   alt="Jaquette de ${escapeHTML(game.name)}"
                   loading="lazy">`
              : `<div class="game-icon" aria-hidden="true">🎮</div>`
          }

          <h3>${escapeHTML(game.name || "Jeu sans titre")}</h3>
          ${releaseDate}
          ${rating}
          <div class="tags">${tags}</div>
          ${link}
          ${
            officialPage
              ? `<a class="game-official-link"
                   href="${escapeHTML(officialPage)}"
                   target="_blank"
                   rel="noopener noreferrer">
                   Site officiel
                 </a>`
              : ""
          }
        </article>
      `;
    }).join("");

    setStatus(`${games.length} résultat(s) affiché(s) · Données RAWG`);
  }

  async function searchGames(query) {
    const currentRequest = ++requestNumber;

    if (!query) {
      gamesGrid.innerHTML = `
        <div class="explorer-placeholder card">
          <div class="loading-symbol" aria-hidden="true">🎮</div>
          <h3>Quel jeu cherches-tu ?</h3>
          <p>Écris un titre dans la barre de recherche.</p>
        </div>
      `;
      setStatus("Tape le nom d'un jeu pour commencer.");
      return;
    }

    if (
      !RAWG_API_KEY ||
      RAWG_API_KEY === "COLLE_TA_CLE_RAWG_ICI"
    ) {
      setStatus(
        "Ajoute ta clé API RAWG dans app.js pour activer la recherche.",
        true
      );
      return;
    }

    gamesGrid.innerHTML = `
      <div class="explorer-placeholder card">
        <h3>Recherche en cours…</h3>
        <p>On cherche les jeux correspondants.</p>
      </div>
    `;

    setStatus(`Recherche de « ${query} »…`);

    try {
      const endpoint = new URL("https://api.rawg.io/api/games");
      endpoint.searchParams.set("key", RAWG_API_KEY);
      endpoint.searchParams.set("search", query);
      endpoint.searchParams.set("page_size", "20");
      endpoint.searchParams.set("search_precise", "false");

      const response = await fetch(endpoint);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Clé API invalide ou accès refusé.");
        }
        if (response.status === 429) {
          throw new Error("Limite de recherche atteinte. Réessaie plus tard.");
        }
        throw new Error(`Erreur du catalogue (${response.status}).`);
      }

      const data = await response.json();

      // Ignore les réponses d'une ancienne recherche.
      if (currentRequest !== requestNumber) return;

      let games = Array.isArray(data.results) ? data.results : [];

      // Le filtre NOVARA ne s'applique pas au catalogue externe.
      // Il sera remplacé par un vrai filtre de plateforme plus tard.
      const selectedStatus = statusFilter?.value || "all";

      if (selectedStatus !== "all") {
        setStatus(
          "Le filtre de disponibilité NOVARA n'est pas applicable aux résultats RAWG.",
          true
        );
      }

      renderGames(games);
    } catch (error) {
      if (currentRequest !== requestNumber) return;

      console.error("NOVARA — recherche RAWG :", error);
      gamesGrid.innerHTML = `
        <div class="explorer-placeholder card">
          <h3>Recherche indisponible</h3>
          <p>${escapeHTML(error.message || "Une erreur est survenue.")}</p>
        </div>
      `;
      setStatus(
        "Impossible de charger les jeux. Vérifie la clé API et ta connexion.",
        true
      );
    }
  }

  if (search) {
    search.addEventListener("input", () => {
      clearTimeout(searchTimer);

      const query = search.value.trim();

      searchTimer = setTimeout(() => {
        searchGames(query);
      }, 350);
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", () => {
      if (statusFilter.value !== "all") {
        setStatus(
          "Le filtre de disponibilité sera adapté au catalogue NOVARA.",
          true
        );
      } else {
        setStatus("Tu peux rechercher un jeu dans le catalogue.");
      }
    });
  }

  // Ne lance pas des centaines de requêtes au chargement.
  searchGames("");
}
