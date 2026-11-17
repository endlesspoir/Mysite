/*
 * NovEspoir site config.
 *
 * leadEndpoint — full URL of the Appwrite Function endpoint, for example:
 *   leadEndpoint: "https://leads.fra.appwrite.run/lead"
 * Leave it empty until the function is deployed: the form will then show
 * the email fallback instead of silently losing requests.
 *
 * web3formsKey — the simplest email delivery option. Get a free access key at
 *   https://web3forms.com/#start
 * using romanetsmaks0@gmail.com, then paste it here. The form will send leads
 * directly to that inbox without Appwrite. If both this and leadEndpoint are
 * set, leadEndpoint wins.
 *
 * botUrl — optional public Telegram bot/channel link. It is hidden while empty.
 * Do not put a personal Telegram account here.
 */
window.NOVESPOIR_CONFIG = {
  leadEndpoint: "",
  web3formsKey: "21cec1ab-3110-44fb-8eb1-ef44b0a36bce",
  email: "romanetsmaks0@gmail.com",
  botUrl: "",
  siteUrl: "https://novespoir.tech"
};
