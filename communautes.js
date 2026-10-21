
(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);

  const status = $("#community-status");
  const grid = $("#community-grid");
  const createForm = $("#create-community-form");
  const chatPanel = $("#community-chat");
  const chatMessages = $("#community-chat-messages");
  const chatForm = $("#community-chat-form");
  const messageInput = $("#community-message-input");

  let supabase = null;
  let currentUser = null;
  let communities = [];
  let joinedIds = new Set();
  let activeCommunity = null;
  let lastMessageIds = "";
  let refreshTimer = null;
  let loadingMessages = false;

  function showStatus(message, type = "") {
    status.textContent = message;
    status.className = "community-status" + (type ? " " + type : "");
  }

  function setButtonBusy(button, busy, busyText = "Chargement…") {
    if (!button) return;

    if (busy) {
      button.dataset.originalText = button.textContent;
      button.textContent = busyText;
      button.disabled = true;
    } else {
      button.textContent = button.dataset.originalText || button.textContent;
      button.disabled = false;
    }
  }

  function makeElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;

    return element;
  }

  function getErrorMessage(error) {
    if (!error) return "Une erreur inconnue est survenue.";

    if (error.code === "42501") {
      return "Action refusée par les règles de sécurité Supabase. Vérifie les politiques RLS.";
    }

    if (error.code === "23505") {
      return "Tu es déjà membre de cette communauté.";
    }

    return error.message || "Une erreur est survenue.";
  }

  async function loadCommunities() {
    grid.replaceChildren(makeElement("p", "community-empty", "Chargement…"));

    const [communityResult, membershipResult] = await Promise.all([
      supabase
        .from("communities")
        .select("id, name, description, game, creator_id, created_at")
        .order("created_at", { ascending: false }),

      supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", currentUser.id)
    ]);

    if (communityResult.error) {
      grid.replaceChildren(
        makeElement(
          "p",
          "community-empty",
          "Impossible de charger les communautés : " +
            getErrorMessage(communityResult.error)
        )
      );
      showStatus("Erreur de chargement.", "error");
      return;
    }

    if (membershipResult.error) {
      grid.replaceChildren(
        makeElement(
          "p",
          "community-empty",
          "Impossible de charger tes inscriptions : " +
            getErrorMessage(membershipResult.error)
        )
      );
      showStatus("Erreur de chargement.", "error");
      return;
    }

    communities = communityResult.data || [];
    joinedIds = new Set(
      (membershipResult.data || []).map((membership) => membership.community_id)
    );

    renderCommunities();

    showStatus(
      communities.length
        ? `${communities.length} communauté(s) disponible(s).`
        : "Aucune communauté pour le moment. Tu peux créer la première !"
    );
  }

  function renderCommunities() {
    grid.replaceChildren();

    if (!communities.length) {
      grid.append(
        makeElement(
          "p",
          "community-empty",
          "Aucune communauté pour le moment. Crée la première !"
        )
      );
      return;
    }

    communities.forEach((community) => {
      const card = makeElement("article", "community-card card");
      const art = makeElement("div", "community-art community-art-purple");
      const symbol = makeElement(
        "span",
        "community-game-symbol",
        (community.game || community.name || "N").charAt(0).toUpperCase()
      );
      const category = makeElement(
        "span",
        "community-category",
        community.creator_id === currentUser.id ? "TON GROUPE" : "COMMUNAUTÉ"
      );

      art.append(symbol, category);

      const content = makeElement("div", "community-card-content");
      const title = makeElement("h3", "", community.name);
      const description = makeElement("p", "", community.description);
      const game = makeElement(
        "span",
        "community-game-label",
        community.game || "Autre"
      );

      content.append(title, description, game);

      const actions = makeElement("div", "community-actions");
      const isMember = joinedIds.has(community.id);

      if (isMember) {
        const openChat = makeElement(
          "button",
          "community-action primary",
          "Ouvrir la discussion"
        );

        openChat.type = "button";
        openChat.addEventListener("click", () => openCommunityChat(community));
        actions.append(openChat);

        if (community.creator_id !== currentUser.id) {
          const leave = makeElement("button", "community-action", "Quitter");
          leave.type = "button";
          leave.addEventListener("click", () => leaveCommunity(community, leave));
          actions.append(leave);
        } else {
          actions.append(
            makeElement("span", "community-status", "Tu es le créateur")
          );
        }
      } else {
        const join = makeElement(
          "button",
          "community-action primary",
          "Rejoindre"
        );

        join.type = "button";
        join.addEventListener("click", () => joinCommunity(community, join));
        actions.append(join);
      }

      content.append(actions);
      card.append(art, content);
      grid.append(card);
    });
  }

  async function createCommunity(event) {
    event.preventDefault();

    const submitButton = createForm.querySelector('[type="submit"]');
    const name = $("#community-name").value.trim();
    const game = $("#community-game").value;
    const description = $("#community-description").value.trim();

    if (name.length < 3 || name.length > 50) {
      showStatus("Le nom doit contenir entre 3 et 50 caractères.", "error");
      return;
    }

    if (!description || description.length > 500) {
      showStatus("La description doit contenir entre 1 et 500 caractères.", "error");
      return;
    }

    setButtonBusy(submitButton, true, "Création…");

    try {
      const { data: community, error } = await supabase
        .from("communities")
        .insert({
          name,
          game,
          description,
          creator_id: currentUser.id
        })
        .select("id, name, description, game, creator_id, created_at")
        .single();

      if (error) throw error;

      const { error: membershipError } = await supabase
        .from("community_members")
        .insert({
          community_id: community.id,
          user_id: currentUser.id
        });

      if (membershipError) {
        showStatus(
          "Communauté créée, mais l'inscription automatique a échoué : " +
            getErrorMessage(membershipError),
          "error"
        );
      } else {
        showStatus("Communauté créée ! Tu en es maintenant membre.", "success");
      }

      createForm.reset();
      createForm.hidden = true;

      await loadCommunities();

      if (!membershipError) {
        await openCommunityChat(community);
      }
    } catch (error) {
      showStatus("Création impossible : " + getErrorMessage(error), "error");
    } finally {
      setButtonBusy(submitButton, false);
    }
  }

  async function joinCommunity(community, button) {
    setButtonBusy(button, true, "Inscription…");

    try {
      const { error } = await supabase
        .from("community_members")
        .insert({
          community_id: community.id,
          user_id: currentUser.id
        });

      if (error) throw error;

      showStatus(`Tu as rejoint « ${community.name} » !`, "success");
      await loadCommunities();
      await openCommunityChat(community);
    } catch (error) {
      showStatus("Impossible de rejoindre : " + getErrorMessage(error), "error");
    } finally {
      setButtonBusy(button, false);
    }
  }

  async function leaveCommunity(community, button) {
    if (!confirm(`Veux-tu vraiment quitter « ${community.name} » ?`)) return;

    setButtonBusy(button, true, "Départ…");

    try {
      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("community_id", community.id)
        .eq("user_id", currentUser.id);

      if (error) throw error;

      if (activeCommunity?.id === community.id) {
        closeCommunityChat();
      }

      showStatus(`Tu as quitté « ${community.name} ».`, "success");
      await loadCommunities();
    } catch (error) {
      showStatus("Impossible de quitter : " + getErrorMessage(error), "error");
    } finally {
      setButtonBusy(button, false);
    }
  }

  async function openCommunityChat(community) {
    if (!joinedIds.has(community.id)) {
      showStatus("Rejoins cette communauté pour accéder à la discussion.", "error");
      return;
    }

    activeCommunity = community;
    lastMessageIds = "";

    $("#community-chat-title").textContent = community.name;
    $("#community-chat-description").textContent =
      `${community.game || "Autre"} · Discussion réservée aux membres`;

    chatPanel.hidden = false;
    chatMessages.replaceChildren(
      makeElement("p", "community-empty", "Chargement des messages…")
    );

    chatPanel.scrollIntoView({ behavior: "smooth", block: "start" });

    await loadMessages();
  }

  function closeCommunityChat() {
    activeCommunity = null;
    lastMessageIds = "";
    chatPanel.hidden = true;
    chatMessages.replaceChildren();

    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  async function loadMessages() {
    if (!activeCommunity || loadingMessages) return;

    loadingMessages = true;
    const communityId = activeCommunity.id;

    try {
      const { data, error } = await supabase
        .from("community_messages")
        .select("id, community_id, author_id, content, created_at")
        .eq("community_id", communityId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;
      if (!activeCommunity || activeCommunity.id !== communityId) return;

      const messages = data || [];
      const signature = messages.map((message) => message.id).join(",");

      if (signature !== lastMessageIds) {
        lastMessageIds = signature;
        renderMessages(messages);
      }
    } catch (error) {
      if (activeCommunity?.id === communityId) {
        chatMessages.replaceChildren(
          makeElement(
            "p",
            "community-empty",
            "Impossible de charger les messages : " + getErrorMessage(error)
          )
        );
      }
    } finally {
      loadingMessages = false;
    }
  }

  function renderMessages(messages) {
    chatMessages.replaceChildren();

    if (!messages.length) {
      chatMessages.append(
        makeElement(
          "p",
          "community-empty",
          "Pas encore de messages. Lance la conversation !"
        )
      );
      return;
    }

    messages.forEach((message) => {
      const own = message.author_id === currentUser.id;
      const item = makeElement(
        "article",
        "community-message" + (own ? " own" : "")
      );

      const meta = makeElement("div", "community-message-meta");
      const author = own
        ? "Toi"
        : "Joueur " + message.author_id.slice(0, 6);

      const date = new Date(message.created_at);
      const timeText = Number.isNaN(date.getTime())
        ? ""
        : date.toLocaleString("fr-FR", {
            dateStyle: "short",
            timeStyle: "short"
          });

      meta.append(
        makeElement("strong", "", author),
        makeElement("span", "", timeText)
      );

      const text = makeElement("p", "", message.content);
      item.append(meta, text);
      chatMessages.append(item);
    });

    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function sendMessage(event) {
    event.preventDefault();

    if (!activeCommunity) return;

    const content = messageInput.value.trim();
    if (!content) return;

    const submitButton = chatForm.querySelector('[type="submit"]');
    const communityId = activeCommunity.id;

    setButtonBusy(submitButton, true, "Envoi…");

    try {
      const { error } = await supabase
        .from("community_messages")
        .insert({
          community_id: communityId,
          author_id: currentUser.id,
          content
        });

      if (error) throw error;

      messageInput.value = "";
      await loadMessages();
    } catch (error) {
      showStatus("Envoi impossible : " + getErrorMessage(error), "error");
    } finally {
      setButtonBusy(submitButton, false);
      messageInput.focus();
    }
  }

  async function init() {
    if (!window.novaraSupabase) {
      showStatus(
        "Client Supabase introuvable. Vérifie la configuration de auth.js.",
        "error"
      );
      grid.replaceChildren(
        makeElement("p", "community-empty", "Connexion à Supabase impossible.")
      );
      return;
    }

    supabase = window.novaraSupabase;

    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      showStatus("Connecte-toi pour accéder aux communautés.", "error");
      grid.replaceChildren(
        makeElement("p", "community-empty", "Redirection vers la connexion…")
      );

      setTimeout(() => {
        window.location.href = "connexion.html";
      }, 900);

      return;
    }

    currentUser = data.user;

    $("#show-create-community").addEventListener("click", () => {
      createForm.hidden = !createForm.hidden;

      if (!createForm.hidden) {
        $("#community-name").focus();
        createForm.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });

    $("#cancel-create-community").addEventListener("click", () => {
      createForm.reset();
      createForm.hidden = true;
    });

    $("#refresh-communities").addEventListener("click", loadCommunities);
    $("#close-community-chat").addEventListener("click", closeCommunityChat);
    createForm.addEventListener("submit", createCommunity);
    chatForm.addEventListener("submit", sendMessage);

    await loadCommunities();

    refreshTimer = setInterval(() => {
      if (activeCommunity) loadMessages();
    }, 5000);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
