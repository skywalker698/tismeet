const CACHE_NAME = "tis-meet-v1";
const APP_SHELL = [
    "./",
    "./index.html",
    "./manifest.json",
    "./icon-192.png",
    "./icon-512.png"
];
/* =========================================================
   INSTALL
   ========================================================= */
self.addEventListener(
    "install",
    function(event) {
        event.waitUntil(
            caches.open(CACHE_NAME)
                .then(
                    function(cache) {
                        return cache.addAll(
                            APP_SHELL
                        );
                    }
                )
        );
        self.skipWaiting();
    }
);
/* =========================================================
   ACTIVATE
   ========================================================= */
self.addEventListener(
    "activate",
    function(event) {
        event.waitUntil(
            caches.keys()
                .then(
                    function(cacheNames) {
                        return Promise.all(
                            cacheNames
                                .filter(
                                    function(name) {
                                        return (
                                            name !==
                                            CACHE_NAME
                                        );
                                    }
                                )
                                .map(
                                    function(name) {
                                        return caches.delete(
                                            name
                                        );
                                    }
                                )
                        );
                    }
                )
        );
        self.clients.claim();
    }
);
/* =========================================================
   FETCH
   ========================================================= */
self.addEventListener(
    "fetch",
    function(event) {
        /*
         * ไม่ Cache Google Apps Script
         * เพราะข้อมูลระบบต้องเป็นข้อมูลปัจจุบัน
         */
        if (
            event.request.url.includes(
                "script.google.com"
            )
        ) {
            return;
        }
        event.respondWith(
            fetch(event.request)
                .then(
                    function(response) {
                        return response;
                    }
                )
                .catch(
                    function() {
                        return caches.match(
                            event.request
                        );
                    }
                )
        );
    }
);
