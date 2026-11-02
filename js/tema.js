// js/tema.js  (bonus modo oscuro)
// Se carga en el <head> sin defer para poner la clase .dark antes de pintar y
// evitar el parpadeo. Usa la misma clave que basecoat.theme ('themeMode'); si
// nunca se eligió, sigue la preferencia del sistema.
(function aplicarTemaGuardado() {
  var oscuro = false;
  try {
    var guardado = localStorage.getItem('themeMode');
    oscuro = guardado ? guardado === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch (e) {
    oscuro = false;
  }
  document.documentElement.classList.toggle('dark', oscuro);
})();
