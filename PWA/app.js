if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/pwa/sw.js')
    .then(() => console.log('✅ Service Worker registrado'))
    .catch(err => console.log('❌ Falha ao registrar SW', err));
}
