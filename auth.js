
(function () {
  const page = window.location.pathname
    .split("/")
    .pop()
    .toLowerCase();

  const publicPages = ["connexion.html", "inscription.html"];

  // La connexion et l'inscription doivent rester accessibles.
  if (publicPages.includes(page)) {
    document.documentElement.classList.remove("auth-checking");
    return;
  }

  function redirectToLogin() {
    const destination =
      window.location.pathname +
      window.location.search +
      window.location.hash;

    const loginUrl = new URL("connexion.html", window.location.href);
    loginUrl.searchParams.set("redirect", destination);
    window.location.replace(loginUrl.href);
  }

  if (!window.supabase) {
    console.error("Supabase n'est pas chargé.");
    redirectToLogin();
    return;
  }

  const client = window.supabase.createClient(
    "https://smxjkgcxjzomkqwaaxlr.supabase.co",
    "sb_publishable_SaIzHbrr-jTPPnFhztD36w_N6o6vuBX"
  );

  async function verifySession() {
    try {
      const { data, error } = await client.auth.getSession();

      if (error || !data.session) {
        redirectToLogin();
        return;
      }

      document.documentElement.classList.remove("auth-checking");
      document.documentElement.style.visibility = "visible";
    } catch (error) {
      console.error("Vérification de session impossible :", error);
      redirectToLogin();
    }
  }

  verifySession();
})();
