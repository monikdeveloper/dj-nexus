'use strict';

var CACHE_NAME = 'nexus-cache-v19';
var CORE_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/dom.js',
  './js/theme.js',
  './js/lighting.js',
  './js/hero3d.js',
  './js/smoke.js',
  './js/main.js',
  './manifest.json',
  './assets/images/logo-icon.png',
  './assets/images/icon-192.png',
  './assets/images/icon-512.png',
  './assets/images/hero-placeholder.png',
  './assets/images/portrait-placeholder.png',
  './assets/images/smoke-1.svg',
  './assets/images/smoke-2.svg'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(CORE_ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) {
            return key !== CACHE_NAME;
          })
          .map(function (key) {
            return caches.delete(key);
          })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;

  var url = new URL(event.request.url);
  var isHTML =
    event.request.mode === 'navigate' ||
    url.pathname === '/' ||
    url.pathname.endsWith('/') ||
    url.pathname.endsWith('.html');

  if (isHTML) {
    event.respondWith(
      fetch(event.request)
        .then(function (response) {
          if (response && response.status === 200) {
            var copy = response.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(event.request, copy);
            });
          }
          return response;
        })
        .catch(function () {
          return caches.match(event.request).then(function (cached) {
            return cached || caches.match('./index.html');
          });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request)
        .then(function (response) {
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, copy);
          });
          return response;
        })
        .catch(function () {
          return caches.match('./index.html');
        });
    })
  );
});
