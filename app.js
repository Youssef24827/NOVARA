
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
        ? `<a class="btn primary"
             style="width:100%;margin-top:12px"
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
        throw new Error("La réponse de Supabase n'est pas une liste.");
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

  if (search) {
    search.addEventListener("input", () => {
      const query = search.value.trim().toLocaleLowerCase("fr");

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
