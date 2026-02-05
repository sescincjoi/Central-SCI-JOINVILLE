if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/Central-SCI/sw.js', {
  scope: '/Central-SCI/'
})
    .then(() => console.log('✅ Service Worker registrado'))
    .catch(err => console.log('❌ Falha ao registrar SW', err));
}
