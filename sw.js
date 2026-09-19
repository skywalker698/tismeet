
/* Meeting Room Booking Service Worker
 * - แคชเฉพาะ "App Shell" (index, manifest, icons) ที่อยู่บน github.io
 * - ไม่แตะต้อง request ข้ามโดเมน (script.google.com) เพื่อไม่ให้ข้อมูลเงินเดือนถูกแคชค้าง
 * - เปลี่ยนเลข CACHE_VERSION ทุกครั้งที่แก้ไฟล์ใน SHELL เพื่อให้เครื่องผู้ใช้อัปเดต
 */
const CACHE_VERSION = 'v1';
const CACHE_NAME = `meeting-room-${CACHE_VERSION}`;
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './favicon-48.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      // แคชทีละไฟล์: ถ้าไฟล์ใดหายไป (404) จะไม่ทำให้การติดตั้ง SW ล้มเหลวทั้งหมด
      .then((cache) => Promise.all(
        SHELL.map((path) => cache.add(path).catch((err) => console.warn('SW cache skip:', path, err)))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.startsWith('meeting-room-') && k !== CACHE_NAME)
            .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // ปล่อย Apps Script / Google ผ่านตามปกติ

  // หน้าเว็บ: network-first → ถ้าออฟไลน์ใช้ index.html ที่แคชไว้
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put('./index.html', copy));
          }
          return res;
        })
        .catch(() => caches.match('./index.html', { ignoreSearch: true }))
    );
    return;
  }

  // ไฟล์ static: stale-while-revalidate
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
