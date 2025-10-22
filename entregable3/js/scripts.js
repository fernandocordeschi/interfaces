

// Carruseles por categoría desplazables
/*
  Handler: inicializa y maneja los carruseles por categoría.
  Qué hace: Busca todos los contenedores con la clase `.categoria-carrousel` y
  prepara la lógica de desplazamiento (flechas izquierda/derecha) y el orden
  visual de las tarjetas.
  Para qué sirve: permite recorrer los juegos de una categoría sin recargar
  la página, ajustando la 'order' y opacidad para crear un efecto visual.
  Usado en: home.html
  Puntos clave:
  - Usa `offset` para calcular el desplazamiento circular.
  - Recalcula `order` en CSS para mantener el layout flexible.
  - Añade/quita clases `prev` para marcar los elementos que quedan en los
    extremos y atenuar su opacidad.
*/
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.categoria-carrousel').forEach(function(carrousel) {
    const juegos = Array.from(carrousel.querySelectorAll('.categoria-card'));
    let offset = 0;
    const leftArrow = carrousel.querySelector('.arrow.left');
    const rightArrow = carrousel.querySelector('.arrow.right');

    /*
      updateCategoriaCarrousel: recalcula el orden y el estilo visual de las
      tarjetas dentro de un carrusel de categoría.
      Qué hace: resetea clases/estilos, calcula el `visualOrder` en base al
      `offset` actual y aplica opacidad/clase `prev` a los extremos.
      Usado en: home.html
      Puntos clave:
      - Mantiene el arreglo original `juegos` intacto y sólo cambia CSS `order`.
      - Asegura un comportamiento circular con el modulo (%) para índices.
      - Ajusta `opacity` y `prev` para que los extremos se vean atenuados.
    */
    function updateCategoriaCarrousel() {
      juegos.forEach((card, i) => {
        card.classList.remove('prev');
        card.style.transform = 'scale(1)';
      });
      // Recalcular el orden visual
      juegos.forEach((card, i) => {
        const visualOrder = ((i - offset + juegos.length) % juegos.length);
        card.style.order = visualOrder;
        card.style.opacity = '1';
      });
      // Solo el primero y el último visual deben tener opacidad 0.5
      const visibles = Array.from(juegos).sort((a, b) => a.style.order - b.style.order);
      if (visibles.length > 1) {
        visibles[0].classList.add('prev');
        visibles[0].style.opacity = '0.5';
        visibles[visibles.length - 1].classList.add('prev');
        visibles[visibles.length - 1].style.opacity = '0.5';
      }
    }

    // Handler: clic en flecha izquierda del carrusel de categoría
    // Qué hace: decrementa el offset (circular), añade una clase temporal
    // para disparar la animación CSS y actualiza la vista
    function triggerAnim() {
      const juegosContainer = carrousel.querySelector('.categoria-juegos');
      if (!juegosContainer) return;
      // remover y volver a añadir la clase para asegurar re-disparo
      juegosContainer.classList.remove('anim');
      // Force reflow
      void juegosContainer.offsetWidth;
      juegosContainer.classList.add('anim');
      // quitar la clase tras la duración de la animación (casi 420ms)
      setTimeout(() => juegosContainer.classList.remove('anim'), 500);
    }

    if (leftArrow) {
      leftArrow.addEventListener('click', function() {
        offset = (offset - 1 + juegos.length) % juegos.length;
        updateCategoriaCarrousel();
        triggerAnim();
      });
    }
    // Handler: clic en flecha derecha del carrusel de categoría
    // Qué hace: incrementa el offset (circular), dispara la animación y actualiza la vista
    if (rightArrow) {
      rightArrow.addEventListener('click', function() {
        offset = (offset + 1) % juegos.length;
        updateCategoriaCarrousel();
        triggerAnim();
      });
    }
    updateCategoriaCarrousel();
  });
});

// Carrusel principal de juegos
/*
  Handler: gestiona el carrusel principal (slider) de la página.
  Qué hace: controla qué tarjeta está activa, la anterior y la siguiente,
  aplicando clases CSS (`active`, `prev`, `next`) y opacidades.
  Para qué sirve: destaca un juego en el centro y permite navegar entre ellos.
  Usado en: home.html
  Puntos clave:
  - Mantiene `currentIndex` para saber qué tarjeta está en el centro.
  - Usa clases para controlar estilos/animaciones desde CSS.
  - Expone `moveSlide` en `window` para compatibilidad con botones inline.
*/
document.addEventListener('DOMContentLoaded', function() {
  var carousel = document.getElementById('carousel');
  if (carousel) {
    let currentIndex = 0;
    const cards = carousel.querySelectorAll('.card');

    /*
      updateCarousel: actualiza las clases y opacidades de las tarjetas del
      carrusel principal en base a `currentIndex`.
      Qué hace: remueve clases previas y asigna `active`, `prev`, `next` al
      correspondiente elemento; ajusta opacidad para enfatizar la tarjeta
      central.
      Usado en: home.html
      Puntos clave:
      - Calcula índices de elementos adyacentes con aritmética modular.
      - Resetea estilos inline antes de aplicar los nuevos para evitar
        acumulación de estilos inesperados.
    */
    function updateCarousel() {
      cards.forEach((card, index) => {
        card.classList.remove('active', 'prev', 'next');
        card.style.opacity = '0';
        if (index === currentIndex) {
          card.classList.add('active');
          card.style.opacity = '1';
        } else if (index === (currentIndex - 1 + cards.length) % cards.length) {
          card.classList.add('prev');
          card.style.opacity = '0.5';
        } else if (index === (currentIndex + 1) % cards.length) {
          card.classList.add('next');
          card.style.opacity = '0.5';
        }
      });
    }

    // Función pública: cambia la diapositiva en el carrusel principal
    // Parámetro: step (número) → si es 1 mueve a la siguiente, -1 a la anterior
    // Usado en: home.html (controles del slider)
    function triggerCarouselAnim() {
      if (!carousel) return;
      carousel.classList.remove('anim');
      void carousel.offsetWidth;
      carousel.classList.add('anim');
      setTimeout(() => carousel.classList.remove('anim'), 500);
    }

    window.moveSlide = function(step) {
      currentIndex = (currentIndex - step + cards.length) % cards.length;
      updateCarousel();
      triggerCarouselAnim();
    }

    updateCarousel();

      // Botón jugar solo si el primer juego está al frente
      const playBtn = document.querySelector('.play-btn');
  // Handler: clic en botón 'Jugar'
  // Qué hace: sólo redirige al detalle del juego si la tarjeta activa
  // coincide con el esperado (ej. alt="Juego 1"). Esto permite que el
  // botón sólo funcione cuando el primer juego está en el frente.
  // Usado en: home.html (redirige a game.html cuando corresponde)
      if (playBtn) {
        playBtn.addEventListener('click', function () {
          const activeCard = carousel.querySelector('.card.active img');
          if (activeCard && activeCard.getAttribute('alt') === 'blocka') {
            window.location.href = 'blocka.html';
          }
          if (activeCard && activeCard.getAttribute('alt') === 'peg') {
            window.location.href = 'peg.html';
          }
          if (activeCard && activeCard.getAttribute('alt') === 'bombit3') {
            window.location.href = 'peg.html';
          } 
        });
      }
  }
});
// Comentarios: alternar entre destacados y recientes
/*
  Handler: controla la pestaña de comentarios (destacados vs recientes) y
  añade un contador local de 'likes'.
  Qué hace: cambia la visibilidad de las listas de comentarios al hacer
  click en las pestañas y maneja incrementos locales de likes al pulsar
  botones correspondientes.
  Usado en: game.html (sección de comentarios del juego)
  Puntos clave:
  - No persiste likes: es sólo manipulación del DOM local.
  - Cambia clases `active` en las pestañas para estilos.
*/
document.addEventListener('DOMContentLoaded', function() {
  var destacadosTab = document.getElementById('destacados-tab');
  var recientesTab = document.getElementById('recientes-tab');
  var destacados = document.getElementById('comentarios-destacados');
  var recientes = document.getElementById('comentarios-recientes');
  if(destacadosTab && recientesTab && destacados && recientes) {
    // Handler: mostrar 'destacados'
    // Qué hace: marca la pestaña destacada como activa y muestra la lista
    destacadosTab.addEventListener('click', function() {
      destacadosTab.classList.add('active');
      recientesTab.classList.remove('active');
      destacados.style.display = '';
      recientes.style.display = 'none';
    });
    // Handler: mostrar 'recientes'
    // Qué hace: marca la pestaña recientes como activa y muestra su lista
    recientesTab.addEventListener('click', function() {
      recientesTab.classList.add('active');
      destacadosTab.classList.remove('active');
      recientes.style.display = '';
      destacados.style.display = 'none';
    });
  }

  // Likes locales
  // Qué hace: incrementa el contador visual de likes al hacer click en el
  // botón correspondiente. No se guarda en servidor; sólo DOM.
  // Usado en: game.html
  document.querySelectorAll('.btn-like').forEach(function(btn) {
  btn.addEventListener('click', function() {
    // Si ya tiene la clase 'liked', no hace nada
    if (btn.classList.contains('liked')) return;

    var likesSpan = btn.previousElementSibling;
    var likes = parseInt(likesSpan.textContent, 10) || 0;
    likesSpan.textContent = likes + 1;

    // Marca el botón como que ya fue clickeado
    btn.classList.add('liked');
  });
});
});
// Función para agregar redirección a botones
// selector = la clase o id del botón, url = a dónde queremos ir
/*
  redirectOnClick(selector, url)
  Qué hace: añade un listener a todos los elementos que coinciden con `selector`
  que previene el comportamiento por defecto y redirige el navegador a `url`
  Para qué sirve: reutilizable para botones de redes sociales u otros enlaces
  que deben llevar a una página concreta sin depender del markup original.
  Usado en: index.html, home.html, singup.html (botones sociales y enlaces)
  Puntos clave:
  - Llama a `e.preventDefault()` para evitar navegación por defecto.
  - Usa `window.location.href` para forzar la redirección.
*/
function redirectOnClick(selector, url) {
  document.querySelectorAll(selector).forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = url;
    });
  });
}


//funcion para cerrar sesion con el boton del menu 

document.addEventListener("DOMContentLoaded", () => {
        const logoutButton = document.querySelector(".btn-logout");

        if (logoutButton) {
            logoutButton.addEventListener("click", () => {
                // Opcional: si querés limpiar sesión del almacenamiento local
                // localStorage.clear(); 
                // sessionStorage.clear();

                // Redirigir al index
                window.location.href = "index.html";
            });
        }
    });
// ============================
// FUNCION PARA MANEJAR LOGIN
// ============================
// ============================
// FUNCION PARA MANEJAR LOGIN
// ============================
/*
  manejarLogin(options)
  Qué hace: habilita/deshabilita el botón de login según la validez de los
  campos obligatorios y del captcha 'falso' presente en el form.
  Parámetros (objeto): formSelector, btnSelector, captchaSelector, redireccion
  Usado en: index.html (página de inicio de sesión)
  Puntos clave:
  - Valida sólo en el cliente (no hay petición al servidor).
  - Desactiva el botón si faltan campos o el captcha no está checkeado.
  - Al hacer click (si está habilitado) redirige a `redireccion`.
*/
function manejarLogin({
  formSelector,
  btnSelector,
  captchaSelector,
  redireccion = "home.html"
}) {
  const form = document.querySelector(formSelector);
  const btn = document.querySelector(btnSelector);
  const captcha = document.querySelector(captchaSelector);

  if (!form || !btn || !captcha) return;

  /*
    validarCampos(): comprueba que todos los campos `required` del formulario
    tengan texto y que el checkbox del captcha esté marcado. Habilita o
    deshabilita el botón de envío en consecuencia.
    Puntos clave:
    - Usa `trim()` para evitar espacios vacíos como entrada válida.
    - Lee `captcha.checked` para validar el 'captcha' falso.
  */
  function validarCampos() {
    const obligatorios = form.querySelectorAll("[required]");
    let completos = true;
    obligatorios.forEach(campo => {
      if (!campo.value.trim()) completos = false;
    });
    if (!captcha.checked) completos = false;
    btn.disabled = !completos;
  }

  form.addEventListener("input", validarCampos);
  captcha.addEventListener("change", validarCampos);
  validarCampos();

  // Handler: clic en botón de login
  // Qué hace: previene el envio por defecto y redirige si el botón está habilitado
  btn.addEventListener("click", function(e) {
    e.preventDefault();
    if (!form.checkValidity()) {
    alert("Por favor completa el formulario correctamente.") // bloquea el envío si no pasa la validación HTML
    return;
  }
    if (btn.disabled) return;
    window.location.href = redireccion;
  });
}

// ============================
// FUNCION PARA MANEJAR REGISTRO
// ============================
// ============================
// FUNCION PARA MANEJAR REGISTRO
// ============================
/*
  manejarRegistro(options)
  Qué hace: lógica similar a `manejarLogin` pero para el formulario de
  registro. Además muestra un overlay de bienvenida antes de redirigir.
  Puntos clave:
  - Valida campos `required` y captcha.
  - Al enviar, muestra `.like-overlay` y espera 3 segundos antes de
    redireccionar para dar feedback visual.
*/
function manejarRegistro({
  formSelector,
  btnSelector,
  captchaSelector,
  redireccion = "home.html"
}) {
  const form = document.querySelector(formSelector);
  const btn = document.querySelector(btnSelector);
  const captcha = document.querySelector(captchaSelector);

  if (!form || !btn || !captcha) return;

  /*
    validarCampos(): válida requeridos y estado del captcha para el formulario
    de registro. Igual que en `manejarLogin` habilita/deshabilita el botón.
  */
  function validarCampos() {
    const obligatorios = form.querySelectorAll("[required]");
    let completos = true;
    obligatorios.forEach(campo => {
      if (!campo.value.trim()) completos = false;
    });
    if (!captcha.checked) completos = false;
    btn.disabled = !completos;
  }

  form.addEventListener("input", validarCampos);
  captcha.addEventListener("change", validarCampos);
  validarCampos();

  // Handler: clic en botón de registro
  // Qué hace: muestra overlay de bienvenida y tras 3s redirige si el botón
  // estaba habilitado. Evita envío por defecto del formulario.
  btn.addEventListener("click", function(e) {
  e.preventDefault();
  if (btn.disabled) return;
  if (!form.checkValidity()) {
    alert("Por favor completa el formulario correctamente.") // bloquea el envío si no pasa la validación HTML
    return;
  }

  const overlay = form.querySelector(".like-overlay");
  if (overlay) {
    overlay.classList.add("active"); // activa overlay y pulgar
  }

  // Espera 3 segundos antes de redirigir
  setTimeout(() => {
    window.location.href = redireccion;
  }, 3000);
  });

}

// ============================
// INICIALIZACIÓN AL CARGAR LA PÁGINA
// ============================
/*
  Handler global de inicialización: al cargar el DOM se inicializan las
  funciones de login/registro (si existen en la página) y se configuran
  redirecciones para botones de redes sociales.
  Puntos clave:
  - Evita errores comprobando la existencia de los formularios antes de
    inicializarlos.
  - Centraliza `redirectOnClick` para reutilización.
*/
document.addEventListener("DOMContentLoaded", function() {

  // LOGIN
  if (document.querySelector(".form-registro-login")) {
    manejarLogin({
      formSelector: ".form-registro-login",
      btnSelector: ".btn-login",
      captchaSelector: "#captcha-login",
      redireccion: "home.html"
    });
  }

  // REGISTRO
  if (document.querySelector(".form-registro")) {
    manejarRegistro({
      formSelector: ".form-registro",
      btnSelector: ".btn-registrar",
      captchaSelector: "#captcha",
      redireccion: "home.html"
    });
  }

  // Redirigir botones de redes sociales a home.html
  redirectOnClick('.btn-facebook', 'home.html');
  redirectOnClick('.btn-google', 'home.html');
  
  redirectOnClick('.btn-facebook-login', 'home.html');
  redirectOnClick('.btn-google-login', 'home.html');
});

// Efecto: mostrar botón premium mobile temporalmente con brillo
document.addEventListener('DOMContentLoaded', function() {
  const premiumDesktop = document.querySelector('.btn-premium-desktop');
  if (!premiumDesktop) return;

  let timer = null;

  function activateTemporary() {
    // Si hay un timer activo, lo limpiamos (y reiniciamos el conteo)
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    // Para reiniciar la animación CSS en cada entrada, si la clase
    // 'shine' ya está presente la removemos y forzamos un reflow antes
    // de volver a añadirla. Esto hace que la animación se reproduzca
    // desde el inicio cada vez que el usuario pone el cursor o toca.
    if (premiumDesktop.classList.contains('shine')) {
      premiumDesktop.classList.remove('shine');
      // Forzar reflow
      void premiumDesktop.offsetWidth;
    }

    premiumDesktop.classList.add('shine');
    // Volver a quitar el brillo tras 2 segundos
    timer = setTimeout(() => {
      premiumDesktop.classList.remove('shine');
      timer = null;
    }, 2000);
  }

  // attach events to the whole premium container for better hit area
  const premiumContainer = document.querySelector('.btn-premium');
  if (premiumContainer) {
    premiumContainer.addEventListener('mouseenter', activateTemporary);
    premiumContainer.addEventListener('touchstart', activateTemporary);
  } else {
    premiumDesktop.addEventListener('mouseenter', activateTemporary);
    premiumDesktop.addEventListener('touchstart', activateTemporary);
  }
});


// ============================
// ANIMACIÓN DE CARGA
// ============================
/*
  Handler: muestra un overlay de carga con porcentaje simulando una carga
  de 5 segundos.
  Qué hace: incrementa `percentage` periódicamente hasta 100 y luego oculta
  el overlay.
  Puntos clave:
  - No refleja carga real; es una animación temporal para mejor UX.
  - Comprueba la existencia de los elementos antes de operar para evitar
    errores en páginas que no tengan loader.
*/
document.addEventListener("DOMContentLoaded", function() {
  const loader = document.getElementById("loader-overlay");
  const percentageEl = document.getElementById("loader-percentage");

  if(!loader || !percentageEl) return;

  loader.classList.add("active");

  let percentage = 0;
  // Duración total de la animación de carga en milisegundos.
  // Cámbiala si querés que el loader dure más o menos tiempo.
  // Usado en: home.html
  const loaderDurationMs = 500; // 5000 ms = 5 segundos (antes: 5000 ms)
  const intervalTime = loaderDurationMs / 100; // dividir en 100 pasos

  const interval = setInterval(() => {
    percentage++;
    percentageEl.textContent = percentage + "%";

    if (percentage >= 100) {
      clearInterval(interval);
      loader.classList.remove("active");
    }
  }, intervalTime);
});

// ====== Carousel simple para home ======
/*
  Handler: carrusel ligero usado en la home. Similar al carrusel principal,
  mantiene el índice actual y actualiza clases `active`, `prev`, `next`.
  Puntos clave:
  - Expone `moveSlide` en `window` para compatibilidad con botones
    inline u otros controladores.
  - Reusa la lógica de cálculo modular para índices adyacentes.
*/
// Si existe un carrusel en la página, inicializarlo
document.addEventListener('DOMContentLoaded', function() {
  const carouselEl = document.querySelector('.carousel');
  if (!carouselEl) return;

  let currentIndex = 0;
  const cards = carouselEl.querySelectorAll('.card');

  /*
    updateCarousel(): actualiza las clases y estilos de las tarjetas del
    carrusel simple en home. Igual que en el carrusel principal, usa
    aritmética modular para determinar prev/next.
  */
  function updateCarousel() {
    cards.forEach((card, index) => {
      card.classList.remove('active', 'prev', 'next');
      card.style.opacity = '0';
      if (index === currentIndex) {
        card.classList.add('active');
        card.style.opacity = '1';
      } else if (index === (currentIndex - 1 + cards.length) % cards.length) {
        card.classList.add('prev');
        card.style.opacity = '0.5';
      } else if (index === (currentIndex + 1) % cards.length) {
        card.classList.add('next');
        card.style.opacity = '0.5';
      }
    });
  }

  // moveSlide: cambia el índice actual del carrusel simple y actualiza vista
  function moveSlide(step) {
    currentIndex = (currentIndex - step + cards.length) % cards.length;
    updateCarousel();
  }

  // Exponer globalmente para que los botones con onclick="moveSlide(...)" funcionen
  window.moveSlide = moveSlide;

  // Inicializa el estado
  updateCarousel();

  // También enlazar flechas si prefieres listeners en lugar de onclick inline
  const leftArrow = document.querySelector('.carousel-container .arrow.left');
  const rightArrow = document.querySelector('.carousel-container .arrow.right');
  if (leftArrow) leftArrow.addEventListener('click', () => moveSlide(-1));
  if (rightArrow) rightArrow.addEventListener('click', () => moveSlide(1));
});

// Toggle Menu Hamburguesa
const menuToggle = document.getElementById('menuToggle');
const menu = document.getElementById('menu');

// Toggle Menú Usuario
const userButton = document.getElementById('user-menu');
const userMenu = document.querySelector('.menu-user');

menuToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  menu.classList.toggle('active');

  // 🔒 Cierra el menú de usuario si está abierto
  if (userMenu.classList.contains('active')) {
    userMenu.classList.remove('active');
  }
});

userButton.addEventListener('click', (e) => {
  e.stopPropagation();
  userMenu.classList.toggle('active');

  // 🔒 Cierra el menú hamburguesa si está abierto
  if (menu.classList.contains('active')) {
    menu.classList.remove('active');
  }
});

// Cierra ambos al hacer clic fuera
document.addEventListener('click', (e) => {
  if (!menu.contains(e.target) && !menuToggle.contains(e.target)) {
    menu.classList.remove('active');
  }
  if (!userMenu.contains(e.target) && !userButton.contains(e.target)) {
    userMenu.classList.remove('active');
  }
});

//tocar en hazte premium lleva a home
document.querySelector('.btn-premium-desktop').addEventListener('click', function() {
  window.location.href = 'home.html';
});