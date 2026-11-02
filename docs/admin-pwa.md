# Admin home-screen app

The admin can be installed from `/admin` after this change is deployed over HTTPS. On iPhone or iPad, open the admin in Safari, tap Share, then Add to Home Screen. In supported desktop or Android browsers, use the browser's install or add-to-home-screen option.

The app opens in its own window and uses the existing admin sign-in. An internet connection is required for admin work. The service worker caches only a generic offline page; it does not cache admin pages, API responses, or receipt data. A previously installed app needs to have opened online before the offline message can appear.

Local verification: lint and TypeScript passed. The manifest and Apple metadata were served on the admin login, and the service worker's offline navigation and API pass-through were checked with a simulated network failure. Physical device installation and offline behavior remain to be checked after deployment.
