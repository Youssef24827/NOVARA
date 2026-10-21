(function () {
  const page = window.location.pathname
    .split("/")
    .pop()
    .toLowerCase();

  const publicPages = ["connexion.html", "inscription.html"];

  if (publicPages.includes(page)) {
    document.documentElement.classList.remove("auth-checking");
    return;
  }

  function redirectToLogin() {
    if (window.__novaraRedirecting) return;
    window.__novaraRedirecting = true;

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
    document.documentElement.classList.remove("auth-checking");
    redirectToLogin();
    return;
  }

  const SUPABASE_URL = "https://smxjkgcxjzomkqwaaxlr.supabase.co";
  const SUPABASE_ANON_KEY =
    "sb_publishable_SaIzHbrr-jTPPnFhztD36w_N6o6vuBX";

  // Réutilise le même client dans les pages NOVARA.
  const client =
    window.novaraSupabase ||
    window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  window.novaraSupabase = client;

  async function verifySession() {
    try {
      const { data, error } = await client.auth.getSession();

      if (error) {
        console.error("Erreur de vérification de session :", error);
        document.documentElement.classList.remove("auth-checking");
        redirectToLogin();
        return;
      }

      if (!data.session) {
        document.documentElement.classList.remove("auth-checking");
        redirectToLogin();
        return;
      }

      document.documentElement.classList.remove("auth-checking");
      document.documentElement.style.visibility = "visible";
    } catch (error) {
      console.error("Vérification de session impossible :", error);
      document.documentElement.classList.remove("auth-checking");
      redirectToLogin();
    }
  }

  verifySession();
})();
