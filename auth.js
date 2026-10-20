
(function () {
  const currentPage = window.location.pathname
    .split("/")
    .pop()
    .toLowerCase();

  // Ces pages doivent rester accessibles sans être connecté.
  const publicPages = ["connexion.html", "inscription.html"];

  if (publicPages.includes(currentPage)) {
    return;
  }

  // Masque la page pendant la vérification de la session.
  document.documentElement.style.visibility = "hidden";

  function redirectToLogin() {
    const returnTo =
      window.location.pathname +
      window.location.search +
      window.location.hash;

    const loginUrl = new URL("connexion.html", window.location.href);
    loginUrl.searchParams.set("redirect", returnTo);

    window.location.replace(loginUrl.href);
  }

  // Vérifie que la bibliothèque Supabase est chargée.
  if (!window.supabase) {
    console.error("La bibliothèque Supabase n'est pas chargée.");
    document.documentElement.style.visibility = "visible";
    return;
  }

  const supabaseClient = window.supabase.createClient(
    "https://smxjkgcxjzomkqwaaxlr.supabase.co",
    "sb_publishable_SaIzHbrr-jTPPnFhztD36w_N6o6vuBX"
  );

  async function checkSession() {
    try {
      const { data, error } = await supabaseClient.auth.getSession();

      if (error || !data.session) {
        redirectToLogin();
        return;
      }

      // Session présente : affiche la page.
      document.documentElement.style.visibility = "visible";
    } catch (error) {
      console.error("Erreur pendant la vérification de session :", error);
      redirectToLogin();
    }
  }

  checkSession();
})();
