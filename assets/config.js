/*
 * NovEspoir site config.
 *
 * leadEndpoint — full URL of the Appwrite Function endpoint, for example:
 *   leadEndpoint: "https://leads.fra.appwrite.run/lead"
 * Leave it empty until the function is deployed: the form will then show
 * the email fallback instead of silently losing requests.
 *
 * botUrl — optional public Telegram bot/channel link. It is hidden while empty.
 * Do not put a personal Telegram account here.
 */
window.NOVESPOIR_CONFIG = {
  leadEndpoint: "",
  email: "romanetsmaks0@gmail.com",
  botUrl: "",
  siteUrl: "https://novespoir.tech"
};
