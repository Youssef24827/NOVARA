
const SUPABASE_URL = "https://smxjkgcxjzomkqwaaxlr.supabase.co";
const SUPABASE_KEY = "sb_publishable_SaIzHbrr-jTPPnFhztD36w_N6o6vuBX";

// ==========================================
// ANNÉE AUTOMATIQUE
// ==========================================
document.querySelectorAll("[data-year]").forEach(element => {
  element.textContent = new Date().getFullYear();
});

// ==========================================
// MENU MOBILE
// ==========================================
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

// ==========================================
// FONCTIONS DE SÉCURITÉ
// ==========================================
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

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
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch (_) {}

    return value.split(",").map(item => item.trim()).filter(Boolean);
  }

  return [String(value)];
}

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

  if (avatar?.type === "image" && avatar.value?.startsWith("data:image/")) {
    avatarImage.src = avatar.value;
    avatarImage.hidden = false;
    avatarEmoji.hidden = true;
  } else {
    avatarImage.removeAttribute("src");
    avatarImage.hidden = true;
    avatarEmoji.hidden = false;
    avatarEmoji.textContent =
      avatar?.type === "emoji" ? avatar.value : DEFAULT_AVATAR;
  }

  avatarOptions.forEach(button => {
    const selected =
      avatar?.type === "emoji" &&
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
        avatar?.type === "emoji" &&
        typeof avatar.value === "string"
      ) {
        showAvatar(avatar);
        return;
      }

      if (
        avatar?.type === "image" &&
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
  uploadAvatarButton?.addEventListener("click", () => {
    avatarFileInput.click();
  });

  avatarFileInput.addEventListener("change", () => {
    const file = avatarFileInput.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif"
    ];

    if (!allowedTypes.includes(file.type)) {
      if (avatarStatus) {
        avatarStatus.textContent =
          "Format non accepté. Choisis une image JPG, PNG, WEBP ou GIF.";
        avatarStatus.classList.add("error");
      }
      avatarFileInput.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      if (avatarStatus) {
        avatarStatus.textContent =
          "L'image dépasse 2 Mo. Choisis une image plus légère.";
        avatarStatus.classList.add("error");
      }
      avatarFileInput.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (
        typeof reader.result !== "string" ||
        !reader.result.startsWith("data:image/")
      ) {
        if (avatarStatus) {
          avatarStatus.textContent = "Impossible de lire cette image.";
          avatarStatus.classList.add("error");
        }
        return;
      }

      saveAvatar({ type: "image", value: reader.result });
      avatarFileInput.value = "";
    };

    reader.onerror = () => {
      if (avatarStatus) {
        avatarStatus.textContent = "Erreur lors de la lecture de l'image.";
        avatarStatus.classList.add("error");
      }
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

  resetAvatarButton?.addEventListener("click", () => {
    try {
      localStorage.removeItem(AVATAR_STORAGE_KEY);
      showAvatar({ type: "emoji", value: DEFAULT_AVATAR });

      if (avatarStatus) {
        avatarStatus.textContent = "Avatar réinitialisé.";
        avatarStatus.classList.remove("error");
      }
    } catch (_) {
      if (avatarStatus) {
        avatarStatus.textContent = "Impossible de réinitialiser l'avatar.";
        avatarStatus.classList.add("error");
      }
    }
  });

  loadAvatar();
}

// ==========================================
// CATALOGUE NOVARA — JEUX STOCKÉS DANS SUPABASE
// Aucun appel direct à RAWG ou à une API Steam.
// ==========================================
const gamesGrid = document.getElementById("gamesGrid");

if (gamesGrid) {
  const searchInput = document.getElementById("gameSearch");
  const statusFilter = document.getElementById("gameStatus");
  const statusMessage = document.getElementById("gamesStatus");

  let searchTimer = null;
  let requestNumber = 0;

  function setGamesStatus(message, isError = false) {
    if (!statusMessage) return;
    statusMessage.textContent = message;
    statusMessage.classList.toggle("error", isError);
  }

  function getGameImage(game) {
    const savedImage = safeURL(game.image_url || "");

    if (savedImage.startsWith("https://")) {
      return savedImage;
    }

    // Repli sur la jaquette Steam, si l'identifiant est un App ID.
    const id = Number(game.id);

    if (Number.isSafeInteger(id) && id > 0) {
      return `https://cdn.akamai.steamstatic.com/steam/apps/${id}/header.jpg`;
    }

    return "";
  }

  function renderGames(games) {
    if (!games.length) {
      gamesGrid.innerHTML = `
        <div class="card explorer-placeholder">
          <h3>Aucun jeu trouvé</h3>
          <p>Essaie un autre titre ou importe plus de jeux dans Supabase.</p>
        </div>
      `;

      setGamesStatus("Aucun résultat dans le catalogue NOVARA.");
      return;
    }

    gamesGrid.innerHTML = games.map(game => {
      const title = escapeHTML(game.title || "Jeu sans titre");
      const genre = escapeHTML(game.genre || "Genre non renseigné");
      const description = escapeHTML(game.description || "");
      const image = getGameImage(game);
      const officialUrl = safeURL(game.official_url || "");
      const platforms = normalizePlatforms(game.platforms)
        .map(escapeHTML)
        .join(", ") || "PC";

      return `
        <article class="card game-result">
          ${
            image
              ? `<img
                   class="game-cover"
                   src="${escapeHTML(image)}"
                   alt="Jaquette de ${title}"
                   loading="lazy"
                 >`
              : `<div class="game-icon" aria-hidden="true">🎮</div>`
          }

          <h3>${title}</h3>
          <p class="game-genre">${genre}</p>
          <p class="game-platforms">${platforms}</p>

          ${description ? `<p class="game-description">${description}</p>` : ""}

          ${
            officialUrl && officialUrl.startsWith("https://")
              ? `<a
                   class="btn primary game-link"
                   href="${escapeHTML(officialUrl)}"
                   target="_blank"
                   rel="noopener noreferrer"
                 >Voir le jeu ↗</a>`
              : ""
          }
        </article>
      `;
    }).join("");

    // Si une image manque, on garde la carte visible.
    gamesGrid.querySelectorAll(".game-cover").forEach(image => {
      image.addEventListener("error", () => {
        image.hidden = true;
      }, { once: true });
    });

    setGamesStatus(
      `${games.length} jeu(x) affiché(s). Le catalogue peut contenir d'autres résultats.`
    );
  }

  async function searchGames() {
    const currentRequest = ++requestNumber;
    const query = (searchInput?.value || "").trim();

    const selectedStatus = statusFilter?.value || "all";

    if (!query) {
      // Affiche les jeux publiés les plus récents alphabétiquement.
      return fetchGames("", selectedStatus, currentRequest);
    }

    return fetchGames(query, selectedStatus, currentRequest);
  }

  async function fetchGames(query, selectedStatus, currentRequest) {
    setGamesStatus(
      query ? `Recherche de « ${query} »…` : "Chargement du catalogue…"
    );

    gamesGrid.innerHTML = `
      <div class="card explorer-placeholder">
        <h3>Chargement des jeux…</h3>
      </div>
    `;

    try {
      const params = new URLSearchParams();

      params.set(
        "select",
        "id,title,description,genre,platforms,official_url,image_url"
      );
      params.set("is_published", "eq.true");
      params.set("order", "title.asc");
      params.set("limit", query ? "60" : "12");

      if (query) {
        // Recherche simple dans les titres.
        // On évite les caractères de syntaxe PostgREST.
        const safeQuery = query.replace(/[%_,.*()]/g, " ").trim();

        if (!safeQuery) {
          renderGames([]);
          return;
        }

        params.set("title", `ilike.*${safeQuery}*`);
      }

      // Les anciennes options de disponibilité ne sont pas prises
      // en charge tant que la table ne possède pas de champ dédié.
      if (selectedStatus !== "all") {
        setGamesStatus(
          "Le filtre de disponibilité sera activé quand les données existeront.",
          true
        );
      }

      const endpoint =
        `${SUPABASE_URL}/rest/v1/games?${params.toString()}`;

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur Supabase (${response.status})`);
      }

      const games = await response.json();

      if (currentRequest !== requestNumber) return;

      renderGames(Array.isArray(games) ? games : []);
    } catch (error) {
      if (currentRequest !== requestNumber) return;

      console.error("NOVARA — catalogue Supabase :", error);

      gamesGrid.innerHTML = `
        <div class="card explorer-placeholder">
          <h3>Catalogue indisponible</h3>
          <p>Vérifie la connexion et les permissions Supabase.</p>
        </div>
      `;

      setGamesStatus(
        "Impossible de charger le catalogue. Vérifie la table games et ses autorisations.",
        true
      );
    }
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(searchGames, 300);
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", searchGames);
  }

  searchGames();
}
