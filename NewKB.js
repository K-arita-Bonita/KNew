console.log("K-ARITA BONITA: JavaScript conectado");
// ============================================
// K-ARITA BONITA | SCRIPT PRINCIPAL
// ============================================

// CONFIGURACIÓN DEL PEDIDO
let pedidoAbierto = false;
let fechaCierreManual = "Por confirmar";

// CONFIGURACIÓN GENERAL
const numeroWhatsApp = "5214462399389";

const urlProductos =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_3KXLcfc_Y_-ZX9fbtthxQF2FykLW8Hqax8Ws1OXAFqTsZOe1qZHVSDBqXJLp6F_anDNRgiczdx9m/pub?gid=982133858&single=true&output=csv";

// ENLACE DE GOOGLE SHEETS - RUTINAS
const urlRutinas =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_3KXLcfc_Y_-ZX9fbtthxQF2FykLW8Hqax8Ws1OXAFqTsZOe1qZHVSDBqXJLp6F_anDNRgiczdx9m/pub?gid=1059930879&single=true&output=csv";

let productos = [];

let carrito = [];

let rutinas = [];

try {
  const carritoGuardado = JSON.parse(
    localStorage.getItem("karitaBonitaCarrito") || "[]"
  );

  if (Array.isArray(carritoGuardado)) {
    carrito = carritoGuardado;
  }

} catch (error) {
  console.warn("No se pudo recuperar el carrito:", error);
}

// GUARDAR CARRITO ENTRE PÁGINAS
function guardarCarrito() {

  try {
    localStorage.setItem(
      "karitaBonitaCarrito",
      JSON.stringify(carrito)
    );
  } catch (error) {
    console.warn("No se pudo guardar el carrito:", error);
  }

}

// ============================================
// FUNCIONES GENERALES
// ============================================

function normalizar(valor) {
  return String(valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizarCategoria(valor) {
  return normalizar(valor).replace(/\s+/g, "");
}

function limpiarTexto(valor) {
  return String(valor ?? "").trim();
}

function escaparHTML(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[caracter]);
}

function convertirNumero(valor) {
  const numero = Number(
    String(valor ?? "")
      .replace(/[$,\s]/g, "")
  );

  return Number.isFinite(numero) ? numero : 0;
}

function esSi(valor) {
  return ["si", "sí", "true", "1", "yes"]
    .includes(normalizar(valor));
}

function estaAgotado(valor) {
  return normalizar(valor) === "agotado";
}

function formatearPrecio(valor) {
  return Number(valor || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2
  });
}

function campo(row, nombre) {
  const clave = Object.keys(row).find(
    k => normalizar(k) === normalizar(nombre)
  );

  return clave ? row[clave] : "";
}

function convertirLista(valor) {
  return String(valor ?? "")
    .split(",")
    .map(x => limpiarTexto(x))
    .filter(Boolean);
}

function obtenerIndice(producto) {
  return productos.indexOf(producto);
}

function productoAgotado(producto) {
  return estaAgotado(producto.stock);
}

// ============================================
// CARGAR PRODUCTOS DESDE GOOGLE SHEETS
// ============================================

function cargarProductos() {

  const contenedor = document.getElementById("productos");

  if (contenedor) {
    contenedor.innerHTML = "<p>Cargando productos...</p>";
  }

  Papa.parse(urlProductos, {
    download: true,
    header: true,
    skipEmptyLines: "greedy",

    complete: function(resultado) {

      if (resultado.errors.length) {
        console.warn("Avisos de lectura CSV:", resultado.errors);
      }



      console.log("Datos recibidos:", resultado.data);
      console.log("Total de filas:", resultado.data.length);
      console.log("Primer producto:", resultado.data[0]);
      
      productos = resultado.data
        .filter(row => limpiarTexto(campo(row, "id")))
        .map(row => ({

          id: limpiarTexto(campo(row, "id")),
          nombre: limpiarTexto(campo(row, "nombre")),
          marca: limpiarTexto(campo(row, "marca")),

          categoria: normalizarCategoria(
            campo(row, "categoria")
          ),
          categoriaPrincipal: limpiarTexto(campo(row, "categoriaPrincipal")),

          piel: convertirLista(campo(row, "piel")),
          problema: convertirLista(campo(row, "problema")),

          oferta: normalizar(campo(row, "oferta")),
          precio: convertirNumero(campo(row, "precio")),
          precioAnterior: convertirNumero(
            campo(row, "precioAnterior")
          ),

          cantidad: limpiarTexto(campo(row, "cantidad")),
          stock: normalizar(campo(row, "stock")),

          imagen: limpiarTexto(campo(row, "imagen")),
          top: normalizar(campo(row, "top")),

          descripcion: limpiarTexto(campo(row, "descripcion")),
          uso: limpiarTexto(campo(row, "uso"))

        }));


      ////////////////////////////////////////aqui borre 
      if (document.body.classList.contains("pagina-ofertas")) {

  const productosOferta = productos.filter(p =>
    esSi(p.oferta)
  );

  mostrarProductos(productosOferta);

} else if (document.body.classList.contains("pagina-catalogo")) {

  const parametros = new URLSearchParams(window.location.search);

  const categoria = parametros.get("categoria");
  const marca = parametros.get("marca");

  const piel = parametros.get("piel");

  const productosCatalogo = productos.filter(p => {

    const coincideCategoria =
      !categoria ||
      normalizar(p.categoriaPrincipal) === normalizar(categoria);

    const coincideMarca =
      !marca ||
      normalizar(p.marca) === normalizar(marca);

    const coincidePiel =
  !piel ||
  p.piel.some(x =>
    normalizar(x) === normalizar(piel) ||
    normalizar(x) === normalizar("Todo tipo de piel")
  );

    return coincideCategoria && coincideMarca && coincidePiel;

  });


  // PRIORIZAR PRODUCTOS SEGÚN EL RESULTADO DEL TEST
if (piel) {
  productosCatalogo.sort((a, b) => {

    function prioridad(producto) {
      const tipos = producto.piel.map(x => normalizar(x));

      const esEspecifico = tipos.includes(normalizar(piel));
      const esUniversal = tipos.includes("todo tipo de piel");

      if (esEspecifico && !esUniversal) return 0;
      if (esEspecifico) return 1;
      if (esUniversal) return 2;

      return 3;
    }

    return prioridad(a) - prioridad(b);
  });
}
  mostrarProductos(productosCatalogo);

  // Reflejar la marca seleccionada en el filtro
  const filtroMarca = document.getElementById("filtroMarca");

  if (marca && filtroMarca) {
    filtroMarca.value = marca;
  }

  const filtroPiel = document.getElementById("filtroPiel");

if (piel && filtroPiel) {
  filtroPiel.value = piel;
}

} else {

  mostrarProductos(productos);

}

   // CARGAR MÁS VENDIDOS SOLO EN INICIO
if (
  !document.body.classList.contains("pagina-catalogo") &&
  !document.body.classList.contains("pagina-ofertas")
) {
  mostrarMasVendidos();
}


// ACTUALIZAR RUTINAS CUANDO CARGUEN LOS PRODUCTOS
if (typeof mostrarRutinasKBeauty === "function") {
  mostrarRutinasKBeauty();
}
// INFORMACIÓN DEL PEDIDO
mostrarInfoPedido();

// ACTUALIZAR CARRITO
actualizarContador();

      // Abrir producto si el enlace contiene su ID
      abrirProductoDesdeEnlace();
    },

    error: function(error) {
      console.error("Error al cargar productos:", error);

      if (contenedor) {
        contenedor.innerHTML =
          "<p>No pudimos cargar el catálogo. Intenta nuevamente.</p>";
      }
    }
  });
}

// CARGAR RUTINAS DESDE GOOGLE SHEETS
function cargarRutinas() {

  Papa.parse(urlRutinas, {
    download: true,
    header: true,
    skipEmptyLines: true,

    complete: function(resultado) {

      rutinas = resultado.data
        .filter(fila =>
          String(fila.id || "").trim() &&
          String(fila.activo || "").trim().toLowerCase() === "si"
        )
        .map(fila => ({

          id: String(fila.id || "").trim(),

          nombre: String(fila.nombre || "").trim(),

          piel: String(fila.piel || "").trim(),

          problema: String(fila.problema || "").trim(),

          descripcion: String(fila.descripcion || "").trim(),

          imagen: String(fila.imagen || "").trim(),

          productosIds: String(fila.productos || "")
            .split(",")
            .map(id => id.trim())
            .filter(Boolean),

          precioRutina: Number(
  String(fila.precioRutina || "0")
    .replace(/[$,\s]/g, "")
),

// PASOS DE LA MAÑANA
rutinaDia: String(fila.rutinaDia || "")
  .split("|")
  .map(paso => paso.trim())
  .filter(Boolean),

// PASOS DE LA NOCHE
rutinaNoche: String(fila.rutinaNoche || "")
  .split("|")
  .map(paso => paso.trim())
  .filter(Boolean),

// RECOMENDACIONES DE USO
notasUso: String(fila.notasUso || "").trim()

        }));

      console.log("Rutinas cargadas:", rutinas.length);

      mostrarRutinasKBeauty();

    },

    error: function(error) {
      console.error("Error al cargar rutinas:", error);
    }
  });

}

// MOSTRAR RUTINAS K-BEAUTY EN INICIO
function mostrarRutinasKBeauty() {

  const contenedor = document.getElementById("listaRutinas");
  if (!contenedor) return;

  // Esperar a que existan los productos y las rutinas
  if (!productos.length || !rutinas.length) return;

  contenedor.innerHTML = rutinas.map(rutina => {

    const incluidos = rutina.productosIds
      .map(id => productos.find(p => String(p.id) === String(id)))
      .filter(Boolean);

    // No mostrar kits incompletos
    if (incluidos.length !== rutina.productosIds.length) {
      return "";
    }

    const totalIndividual = incluidos.reduce(
      (suma, p) => suma + Number(p.precio || 0), 0
    );

    const ahorro = totalIndividual - rutina.precioRutina;

    const carrusel = incluidos.map(p => `
      <div class="rutina-producto">
        <img src="${escaparHTML(p.imagen)}"
             alt="${escaparHTML(p.nombre)}"
             loading="lazy">

        <p>${escaparHTML(p.nombre)}</p>
        <strong>${formatearPrecio(p.precio)}</strong>
      </div>
    `).join("");

    return `
      <article class="rutina-card">

        <img src="${escaparHTML(rutina.imagen)}"
             alt="${escaparHTML(rutina.nombre)}"
             loading="lazy">

        <div class="rutina-card-contenido">

          <h3>${escaparHTML(rutina.nombre)}</h3>

          <p>${escaparHTML(rutina.descripcion)}</p>

          <div class="rutina-precios">
            <span class="rutina-precio-anterior">
              ${formatearPrecio(totalIndividual)}
            </span>

            <span class="rutina-precio-especial">
              ${formatearPrecio(rutina.precioRutina)}
            </span>
          </div>

          <p class="rutina-ahorro">
            Ahorra ${formatearPrecio(ahorro)}
            comprando la rutina completa ♡
          </p>

          <h4>Productos incluidos</h4>

          <div class="rutina-productos">
            ${carrusel}
          </div>

          <button
  class="btn-ver-uso-rutina"
  type="button"
  onclick="abrirUsoRutina('${rutina.id}')">
  ☀️ Ver rutina de uso ♡
</button>

<button
  class="btn-comprar-rutina"
  onclick="agregarRutinaAlCarrito('${rutina.id}')">

  ♡ Agregar rutina completa al carrito

</button>

        </div>
      </article>
    `;
  }).join("");
}

// ==========================================
// INSTRUCCIONES DE USO DE RUTINAS
// ==========================================

let rutinaUsoActual = null;

function abrirUsoRutina(idRutina) {

  const rutina = rutinas.find(
    r => String(r.id) === String(idRutina)
  );

  if (!rutina) return;

  rutinaUsoActual = rutina;

  document.getElementById("tituloUsoRutina").textContent =
    rutina.nombre;

  document.getElementById("notasUsoRutina").textContent =
    rutina.notasUso || "";

  document.getElementById("modalUsoRutina").hidden = false;

  cambiarMomentoRutina("dia");
}

function cambiarMomentoRutina(momento) {

  if (!rutinaUsoActual) return;

  const pasos = momento === "dia"
    ? rutinaUsoActual.rutinaDia
    : rutinaUsoActual.rutinaNoche;

  const lista = document.getElementById("pasosUsoRutina");

  lista.innerHTML = "";

  pasos.forEach(paso => {

    const elemento = document.createElement("li");

    elemento.textContent = paso;

    lista.appendChild(elemento);

  });

  document.getElementById("botonRutinaDia")
    .classList.toggle("activo", momento === "dia");

  document.getElementById("botonRutinaNoche")
    .classList.toggle("activo", momento === "noche");

}

function cerrarUsoRutina() {

  const modal = document.getElementById("modalUsoRutina");

  if (modal) modal.hidden = true;

  rutinaUsoActual = null;
}

// DESLIZAR CARRUSEL DE RUTINAS
function deslizarRutinas(direccion) {

  const carrusel = document.getElementById("listaRutinas");

  if (!carrusel) return;

  const tarjeta = carrusel.querySelector(".rutina-card");

  if (!tarjeta) return;

  const estilos = window.getComputedStyle(carrusel);
  const separacion = parseFloat(estilos.columnGap) || 0;

  const distancia = tarjeta.getBoundingClientRect().width + separacion;

  carrusel.scrollBy({
    left: direccion * distancia,
    behavior: "smooth"
  });

}

// AGREGAR RUTINA COMPLETA AL CARRITO
function agregarRutinaAlCarrito(idRutina) {

  const rutina = rutinas.find(
    r => String(r.id) === String(idRutina)
  );

  if (!rutina) {
    mostrarToast("No encontramos esta rutina");
    return;
  }

  const incluidos = rutina.productosIds.map(id =>
    productos.find(p => String(p.id) === String(id))
  );

  if (
    incluidos.some(p => !p || productoAgotado(p))
  ) {
    mostrarToast("Uno o más productos de la rutina no están disponibles");
    return;
  }

  if (!Number.isFinite(rutina.precioRutina) ||
      rutina.precioRutina <= 0) {
    mostrarToast("El precio de esta rutina no está disponible");
    return;
  }

  const idCarrito = "KIT-" + rutina.id;

  const existente = carrito.find(
    p => String(p.id) === idCarrito
  );

  if (existente) {

    existente.cantidadCarrito++;

  } else {

    carrito.push({
      id: idCarrito,
      nombre: rutina.nombre,
      imagen: rutina.imagen,
      precio: rutina.precioRutina,
      precioSeleccionado: rutina.precioRutina,
      cantidadCarrito: 1,
      esRutina: true,
      productosIncluidos: incluidos.map(p => ({
        id: p.id,
        nombre: p.nombre
      }))
    });

  }

  guardarCarrito();
  actualizarContador();

  mostrarToast(rutina.nombre + " agregada al carrito 💗");
}

// ============================================
// CATEGORÍAS
// ============================================

function generarCategorias() {

  const contenedor = document.getElementById("categorias");

  if (!contenedor) return;

  const categorias = [
    ...new Set(productos.map(p => p.categoria).filter(Boolean))
  ];

  const emojis = {
    cleanser: "🧴",
    toner: "💧",
    serum: "✨",
    cream: "🫧",
    eyecream: "👁️",
    sunscreen: "☀️",
    mask: "🎭",
    hair: "💆🏻‍♀️",
    kit: "🎀"
  };

  contenedor.innerHTML = categorias.map(categoria => {

    const emoji = emojis[normalizar(categoria).replace(/\s+/g, "")] || "🌸";

    return `
      <button
        type="button"
        class="categoria-btn"
        onclick="seleccionarCategoria('${escaparHTML(categoria)}')">
        <span class="categoria-emoji">${emoji}</span>
        <span class="categoria-nombre">${escaparHTML(categoria)}</span>
      </button>
    `;

  }).join("");
}

function seleccionarCategoria(categoria) {

  const filtro = document.getElementById("filtroCategoria");

  if (filtro) {
    filtro.value = categoria;
  }

  filtrar();

  document.getElementById("catalogo")?.scrollIntoView({
    behavior: "smooth"
  });
}

// ============================================
// MOSTRAR PRODUCTOS
// ============================================

function mostrarProductos(lista) {

  const contenedor = document.getElementById("productos");

  if (!contenedor) return;

  contenedor.innerHTML = "";

  if (!lista.length) {
    contenedor.innerHTML = `
      <div class="sin-resultados">
        <p>💗 No encontramos productos con esos filtros.</p>
        <button onclick="limpiarFiltros()">Limpiar filtros</button>
      </div>
    `;
    return;
  }

  lista.forEach(p => {

    const index = obtenerIndice(p);
    const agotado = productoAgotado(p);
    const oferta = esSi(p.oferta);

    let etiquetas = [];

    const equivalencias = {
      "Acné": "💚 Acné",
      "Hidratación": "💧 Hidratación",
      "Manchas/Tono uniforme": "✨ Manchas",
      "Manchas": "✨ Manchas",
      "Poros dilatados": "🔍 Poros",
      "Irritación": "🌿 Calma",
      "Reparación": "🛠️ Reparación",
      "Anti-edad": "⏳ Anti-edad",
      "Firmeza": "💪 Firmeza",
      "Líneas finas": "📉 Líneas",
      "Ojeras": "👁️ Ojeras",
      "Textura": "🧪 Textura",
      "Limpieza profunda": "🧼 Limpieza"
    };

    p.problema.forEach(problema => {
      const etiqueta = Object.keys(equivalencias).find(
        clave => normalizar(clave) === normalizar(problema)
      );

      if (etiqueta && !etiquetas.includes(equivalencias[etiqueta])) {
        etiquetas.push(equivalencias[etiqueta]);
      }
    });

    const etiquetasHTML = etiquetas.map(etiqueta => `
      <span class="tag">${etiqueta}</span>
    `).join("");

    contenedor.innerHTML += `
      <article class="card">

        <div class="badges-dinamicos">

          ${oferta ? '<span class="badge">OFERTA</span>' : ""}

          ${agotado
            ? '<span class="badge stock-agotado">⏳ Agotado</span>'
            : ""
          }

        </div>

        <img
          src="${escaparHTML(p.imagen)}"
          alt="${escaparHTML(p.nombre)}"
          loading="lazy"
          onerror="this.style.visibility='hidden'"
          onclick="verDetalle(${index})"
        >

        <h3>${escaparHTML(p.nombre)}</h3>

        <p class="info">
          <strong>${escaparHTML(p.marca.toUpperCase())}</strong>
        </p>

        <p class="precio">

          ${oferta && p.precioAnterior > 0
            ? `<span class="precio-anterior">
                ${formatearPrecio(p.precioAnterior)}
               </span>`
            : ""
          }

          <span class="precio-dinamico">
            ${formatearPrecio(p.precio)}
          </span>

        </p>

        <p class="info">
          ${escaparHTML(p.cantidad)}
        </p>

        <p class="info">
          ${escaparHTML(p.piel.join(", "))} 
          ${p.piel.length && p.problema.length ? " | " : ""}
          ${escaparHTML(p.problema.join(", "))}
        </p>

        <p class="mensaje">
          ${generarMensaje(p)}
        </p>

        <div class="etiquetas">
          ${etiquetasHTML}
        </div>

        <div class="botones-card">

          ${agotado
            ? `
              <button class="btn-agotado" disabled>
                ⏳ Agotado
              </button>
            `
            : `
              <button onclick="agregarAlCarrito(${index})">
                🛒
              </button>

              <button onclick="pedirProducto(${index})">
                💬 Pedir
              </button>
            `
          }

          <button onclick="verDetalle(${index})">
            Ver más
          </button>

        </div>

      </article>
    `;
  });
}

// MOSTRAR PRODUCTOS MÁS VENDIDOS
function mostrarMasVendidos() {

  const carrusel = document.getElementById("listaMasVendidos");
  const seccion = document.getElementById("masVendidos");

  if (!carrusel || !seccion) return;

  const destacados = productos.filter(p => esSi(p.top));

  if (!destacados.length) {
    carrusel.innerHTML = "";
    seccion.style.display = "none";
    return;
  }

  seccion.style.display = "";

  carrusel.innerHTML = destacados.map(p => {

    const index = obtenerIndice(p);

    return `
      <div class="reco-item" onclick="verDetalle(${index})">

        <img
          src="${escaparHTML(p.imagen)}"
          alt="${escaparHTML(p.nombre)}"
          loading="lazy"
        >

        <p>${escaparHTML(p.nombre)}</p>

        <strong>${formatearPrecio(p.precio)}</strong>

      </div>
    `;

  }).join("");

}


// DESLIZAR CARRUSEL
function deslizarMasVendidos(direccion) {

  const carrusel = document.getElementById("listaMasVendidos");

  if (!carrusel) return;

  const tarjeta = carrusel.querySelector(".reco-item");

  const distancia = tarjeta
    ? tarjeta.getBoundingClientRect().width + 18
    : 280;

  carrusel.scrollBy({
    left: direccion * distancia,
    behavior: "smooth"
  });
}


// ============================================
// MENSAJE SEGÚN EL BENEFICIO
// ============================================

function generarMensaje(p) {

  const problemas = p.problema.map(normalizar);

  const mensajes = {
    "acne": "💚 Ayuda a cuidar la piel con tendencia al acné",
    "hidratacion": "💧 Aporta hidratación a la piel",
    "manchas/tono uniforme": "✨ Ayuda a mejorar la apariencia del tono",
    "manchas": "✨ Ayuda a mejorar la apariencia del tono",
    "poros dilatados": "🔍 Ayuda a mejorar la apariencia de los poros",
    "irritacion": "🌿 Ayuda a calmar la piel",
    "reparacion": "🛠️ Ayuda a cuidar la barrera cutánea",
    "anti-edad": "⏳ Cuidado para los signos de la edad",
    "firmeza": "💪 Cuidado de elasticidad y firmeza",
    "lineas finas": "📉 Cuidado de líneas finas",
    "ojeras": "👁️ Cuidado del contorno de ojos",
    "textura": "🧪 Ayuda a mejorar la apariencia de la textura",
    "limpieza profunda": "🧼 Limpieza profunda"
  };

  for (const problema of problemas) {
    if (mensajes[problema]) {
      return mensajes[problema];
    }
  }

  return "🌿 Un complemento para tu rutina de skincare";
}

// ============================================
// FILTROS Y BÚSQUEDA
// ============================================

function iniciarFiltros() {

  const ids = [
    "filtroCategoria",
    "filtroMarca",
    "filtroPiel",
    "filtroProblema"
  ];

  ids.forEach(id => {
    const elemento = document.getElementById(id);

    if (elemento) {
      elemento.addEventListener("change", filtrar);
    }
  });

  const busqueda = document.getElementById("busqueda");

  if (busqueda) {
    busqueda.addEventListener("input", filtrar);
  }
}

function filtrar() {

  const cat = normalizarCategoria(
    document.getElementById("filtroCategoria")?.value
  );

  const marca = normalizar(
    document.getElementById("filtroMarca")?.value
  );

  const piel = normalizar(
    document.getElementById("filtroPiel")?.value
  );

  const problema = normalizar(
    document.getElementById("filtroProblema")?.value
  );

  const texto = normalizar(
    document.getElementById("busqueda")?.value
  );

  const filtrados = productos.filter(p => {

    const coincideCategoria =
      !cat || normalizarCategoria(p.categoria) === cat;

    const coincideMarca =
      !marca || normalizar(p.marca) === marca;

    const coincidePiel =
      !piel ||
      p.piel.some(x => normalizar(x) === piel) ||
      p.piel.some(x => normalizar(x) === "todo tipo de piel");

    const coincideProblema =
      !problema ||
      p.problema.some(x => normalizar(x) === problema);

    const coincideBusqueda =
      !texto ||
      normalizar(p.nombre).includes(texto) ||
      normalizar(p.marca).includes(texto) ||
      normalizar(p.categoria).includes(texto);

    return (
      coincideCategoria &&
      coincideMarca &&
      coincidePiel &&
      coincideProblema &&
      coincideBusqueda
    );

  });

  // MOSTRAR PRODUCTOS FILTRADOS
  mostrarProductos(filtrados);

  // MOSTRAR RUTINA SOLO CON PIEL O PROBLEMA
  const rutina = document.getElementById("rutina");

  if (piel || problema) {

    mostrarRutina(filtrados);

  } else {

    if (rutina) {
      rutina.innerHTML = "";
    }

  }

}

// ============================================
// LIMPIAR FILTROS
// ============================================

function limpiarFiltros() {

  [
    "filtroCategoria",
    "filtroMarca",
    "filtroPiel",
    "filtroProblema",
    "busqueda"
  ].forEach(id => {
    const elemento = document.getElementById(id);
    if (elemento) elemento.value = "";
  });

  mostrarProductos(productos);

  const recomendados = document.getElementById("recomendados");
  const rutina = document.getElementById("rutina");

  if (recomendados) recomendados.innerHTML = "";
  if (rutina) rutina.innerHTML = "";
}

function limpiarBusqueda() {

  const busqueda = document.getElementById("busqueda");

  if (busqueda) busqueda.value = "";

  filtrar();
}

// ============================================
// PRODUCTOS RECOMENDADOS
// ============================================

function mostrarRecomendados(lista) {

  const contenedor = document.getElementById("recomendados");

  if (!contenedor) return;

  if (lista.length === productos.length || lista.length === 0) {
    contenedor.innerHTML = "";
    return;
  }

  const recomendados = lista
    .filter(p => esSi(p.top) && !productoAgotado(p))
    .slice(0, 3);

  if (!recomendados.length) {
    contenedor.innerHTML = "";
    return;
  }

  contenedor.innerHTML = `
    <h2>✨ Recomendados para ti</h2>
    <div class="recomendados-lista">
      ${recomendados.map(p => `
        <div class="reco-item" onclick="verDetalle(${obtenerIndice(p)})">
          <img src="${escaparHTML(p.imagen)}" alt="${escaparHTML(p.nombre)}" loading="lazy">
          <p>${escaparHTML(p.nombre)}</p>
          <strong>${formatearPrecio(p.precio)}</strong>
        </div>
      `).join("")}
    </div>
  `;
}

// ============================================
// MÁS VENDIDOS
// ============================================

function mostrarTopProductos() {

  const contenedor = document.getElementById("topProductos");

  if (!contenedor) return;

  const top = productos
    .filter(p => esSi(p.top) && !productoAgotado(p))
    .slice(0, 6);

  if (!top.length) {
    contenedor.innerHTML = "";
    return;
  }

  contenedor.innerHTML = `
    <h2>✨ Favoritos de la comunidad</h2>

    <div class="top-lista">
      ${top.map(p => `
        <div class="reco-item" onclick="verDetalle(${obtenerIndice(p)})">
          <img src="${escaparHTML(p.imagen)}" alt="${escaparHTML(p.nombre)}" loading="lazy">
          <p>${escaparHTML(p.nombre)}</p>
          <strong>${formatearPrecio(p.precio)}</strong>
        </div>
      `).join("")}
    </div>
  `;
}

// ============================================
// RUTINA RECOMENDADA
// ============================================

function elegirProductoRutina(lista, categoria, piel, problema) {

  const disponibles = lista.filter(
    p => !productoAgotado(p)
  );

  const coincideCategoria = p =>
    p.categoria === normalizarCategoria(categoria);

  let producto = disponibles.find(p =>
    coincideCategoria(p) &&
    (!piel || p.piel.some(x => normalizar(x) === piel || normalizar(x) === "todo tipo de piel")) &&
    (!problema || p.problema.some(x => normalizar(x) === problema))
  );

  if (producto) return producto;

  producto = disponibles.find(p =>
    coincideCategoria(p) &&
    (!piel || p.piel.some(x => normalizar(x) === piel || normalizar(x) === "todo tipo de piel"))
  );

  if (producto) return producto;

  producto = disponibles.find(p =>
    coincideCategoria(p) &&
    (!problema || p.problema.some(x => normalizar(x) === problema))
  );

  if (producto) return producto;

  producto = disponibles.find(p =>
    coincideCategoria(p) && esSi(p.top)
  );

  if (producto) return producto;

  return disponibles.find(coincideCategoria);
}

function mostrarRutina(lista) {

  const contenedor = document.getElementById("rutina");

  if (!contenedor) return;

  const piel = normalizar(
    document.getElementById("filtroPiel")?.value
  );

  const problema = normalizar(
    document.getElementById("filtroProblema")?.value
  );

  if (!piel && !problema) {
  contenedor.innerHTML = "";
  return;
}

  const rutina = [
    { categoria: "cleanser", nombre: "Limpiador", emoji: "🧼" },
    { categoria: "toner", nombre: "Tónico", emoji: "💧" },
    { categoria: "serum", nombre: "Sérum", emoji: "✨" },
    { categoria: "cream", nombre: "Crema", emoji: "🧴" },
    { categoria: "sunscreen", nombre: "Protector solar", emoji: "☀️" }
  ];

  const seleccionados = rutina.map(paso => ({
    ...paso,
    producto: elegirProductoRutina(
      lista,
      paso.categoria,
      piel,
      problema
    )
  })).filter(paso => paso.producto);

  const usarMascarilla = [
    "acne",
    "manchas/tono uniforme",
    "manchas",
    "irritacion",
    "hidratacion"
  ].includes(problema);

  if (usarMascarilla) {

    const mask = elegirProductoRutina(
      lista,
      "mask",
      piel,
      problema
    );

    if (mask) {
      seleccionados.push({
        categoria: "mask",
        nombre: "Mascarilla",
        emoji: "🧖",
        producto: mask
      });
    }
  }

  if (!seleccionados.length) {
    contenedor.innerHTML = "";
    return;
  }

  contenedor.innerHTML = `
    <h2>🧴 Rutina recomendada</h2>

    <div class="rutina-box">

      ${seleccionados.map(paso => `
        <div class="rutina-item">
          <img
            src="${escaparHTML(paso.producto.imagen)}"
            alt="${escaparHTML(paso.producto.nombre)}"
            loading="lazy"
            onclick="verDetalle(${obtenerIndice(paso.producto)})"
          >

          <span>
            ${paso.emoji} ${paso.nombre}
          </span>

          <small>${escaparHTML(paso.producto.nombre)}</small>
        </div>
      `).join("")}

    </div>

    <button onclick="agregarRutinaFiltrada()">
      Agregar rutina al carrito 🛒
    </button>
  `;
}

// ============================================
// AGREGAR RUTINA AL CARRITO
// ============================================

function agregarRutinaFiltrada() {

  const piel = normalizar(
    document.getElementById("filtroPiel")?.value
  );

  const problema = normalizar(
    document.getElementById("filtroProblema")?.value
  );

  const categorias = [
    "cleanser",
    "toner",
    "serum",
    "cream",
    "sunscreen"
  ];

  let agregados = 0;

  categorias.forEach(categoria => {

    const producto = elegirProductoRutina(
      productos,
      categoria,
      piel,
      problema
    );

    if (producto && !productoAgotado(producto)) {
      agregarProductoCarrito(producto);
      agregados++;
    }
  });

  if (
    ["acne", "manchas/tono uniforme", "manchas", "irritacion", "hidratacion"]
      .includes(problema)
  ) {
    const mask = elegirProductoRutina(
      productos,
      "mask",
      piel,
      problema
    );

    if (mask && !productoAgotado(mask)) {
      agregarProductoCarrito(mask);
      agregados++;
    }
  }

  actualizarContador();

  mostrarToast(
    agregados
      ? "Rutina agregada al carrito 💗"
      : "No encontramos productos disponibles para esta rutina"
  );
}

// ============================================
// CARRITO
// ============================================

function agregarProductoCarrito(producto) {

  if (!producto || productoAgotado(producto)) {
    mostrarToast("Este producto está agotado");
    return false;
  }

  const existente = carrito.find(
    p => p.id === producto.id
  );

  if (existente) {
    existente.cantidadCarrito++;
  } else {
    carrito.push({
      ...producto,
      cantidadCarrito: 1,
      precioSeleccionado: producto.precio
    });
  }

    guardarCarrito();

  return true;
}

function agregarAlCarrito(index) {

  const producto = productos[index];

  if (!producto) return;

  if (agregarProductoCarrito(producto)) {
    actualizarContador();
    mostrarToast(producto.nombre + " agregado 💗");
  }
}

function actualizarContador() {

  const contador = document.getElementById("contadorCarrito");

  if (!contador) return;

  const total = carrito.reduce(
    (suma, p) => suma + p.cantidadCarrito,
    0
  );

  contador.textContent = total;
}

function abrirCarrito() {

  const modal = document.getElementById("modalCarrito");
  const lista = document.getElementById("listaCarrito");

  if (!modal || !lista) return;

  lista.innerHTML = "";

  if (!carrito.length) {

    lista.innerHTML = "<p>Tu carrito está vacío 💗</p>";

  } else {

    let total = 0;

    carrito.forEach((p, index) => {

      const subtotal = p.precioSeleccionado * p.cantidadCarrito;

      total += subtotal;

      lista.innerHTML += `
        <div class="producto-carrito">

          <img
            src="${escaparHTML(p.imagen)}"
            alt="${escaparHTML(p.nombre)}"
          >

          <div>
            <strong>${escaparHTML(p.nombre)}</strong>

            <p>${formatearPrecio(p.precioSeleccionado)}</p>


            <div class="cantidad-carrito">
              <button onclick="cambiarCantidadCarrito(${index}, -1)">−</button>
              <span>${p.cantidadCarrito}</span>
              <button onclick="cambiarCantidadCarrito(${index}, 1)">+</button>
            </div>

            <p>Subtotal: ${formatearPrecio(subtotal)}</p>

            <button onclick="eliminarDelCarrito(${index})">
              Eliminar
            </button>
          </div>

        </div>
      `;
    });

    lista.innerHTML += `
      <h3>Total: ${formatearPrecio(total)}</h3>
      <button onclick="enviarWhatsApp()">
        Finalizar pedido por WhatsApp 💬
      </button>
    `;
  }

  modal.style.display = "block";
  modal.style.pointerEvents = "auto";
}

function cambiarCantidadCarrito(index, cambio) {

  const producto = carrito[index];

  if (!producto) return;

  const nuevaCantidad = producto.cantidadCarrito + cambio;

  if (nuevaCantidad <= 0) {
    eliminarDelCarrito(index);
    return;
  }

    producto.cantidadCarrito = nuevaCantidad;

  guardarCarrito();
  actualizarContador();
  abrirCarrito();
}

function eliminarDelCarrito(index) {

  carrito.splice(index, 1);

  guardarCarrito();
  actualizarContador();
  abrirCarrito();
}

function cerrarCarrito() {

  const modal = document.getElementById("modalCarrito");

  if (!modal) return;

  modal.style.display = "none";
  modal.style.pointerEvents = "none";
}

// ============================================
// WHATSAPP: CARRITO Y RUTINAS
// ============================================

function enviarWhatsApp() {

  if (!carrito.length) {
    mostrarToast("Tu carrito está vacío");
    return;
  }

  let mensaje =
    "Hola 💗 Quiero realizar un pedido en K-arita Bonita:\n\n";

  let total = 0;

  carrito.forEach(p => {

    const precio = Number(p.precioSeleccionado || 0);
    const cantidad = Number(p.cantidadCarrito || 1);

    const subtotal = precio * cantidad;

    total += subtotal;

    if (p.esRutina) {

      // RUTINA COMPLETA
      mensaje +=
        `🌸 RUTINA K-BEAUTY\n` +
        `• ${p.nombre}\n` +
        `  Cantidad de kits: ${cantidad}\n` +
        `  Subtotal: ${formatearPrecio(subtotal)}\n\n`;

    } else {

      // PRODUCTO INDIVIDUAL
mensaje +=
  `• ${p.nombre}\n` +
  `  Cantidad: ${cantidad}\n` +
  `  Subtotal: ${formatearPrecio(subtotal)}\n\n`;

    }

  });

  mensaje +=
    `💗 TOTAL DEL PEDIDO: ${formatearPrecio(total)}\n\n` +
    "¿Me confirmas disponibilidad y cómo puedo realizar mi pedido? 💗";

  abrirWhatsApp(mensaje);
}

// ============================================
// WHATSAPP: CONSULTA
// ============================================

function enviarConsulta() {

  const mensaje =
    "Hola 💗 Vengo de K-arita Bonita y tengo una pregunta sobre sus productos.";

  abrirWhatsApp(mensaje);
}

// ============================================
// WHATSAPP: PRODUCTO INDIVIDUAL
// ============================================

function pedirProducto(index) {

  const p = productos[index];

  if (!p || productoAgotado(p)) {
    mostrarToast("Este producto está agotado");
    return;
  }

  let mensaje =
    "Hola 💗 Me interesa este producto de K-arita Bonita:\n\n";

  mensaje += `🧴 ${p.nombre}\n`;
  mensaje += `🏷️ Marca: ${p.marca}\n`;
  mensaje += `📦 Presentación: ${p.cantidad}\n`;
  mensaje += `💲 Precio: ${formatearPrecio(p.precio)}\n\n`;
  mensaje += "¿Me confirmas disponibilidad y tiempo de entrega? ✨";

  abrirWhatsApp(mensaje);
}

function abrirWhatsApp(mensaje) {

  const url =
    "https://api.whatsapp.com/send?phone=" +
    numeroWhatsApp +
    "&text=" +
    encodeURIComponent(mensaje);

  window.open(url, "_blank");
}

// ============================================
// FICHA INDIVIDUAL DEL PRODUCTO
// ============================================

function verDetalle(index) {

  const p = productos[index];

  if (!p) return;

  const modal = document.getElementById("modalDetalle");
  const contenido = document.getElementById("contenidoDetalle");

  if (!modal || !contenido) return;

  const agotado = productoAgotado(p);
  const oferta = esSi(p.oferta);

  contenido.innerHTML = `

    <div class="detalle-producto">

      <img
        src="${escaparHTML(p.imagen)}"
        alt="${escaparHTML(p.nombre)}"
        class="detalle-imagen"
      >

      <div class="detalle-informacion">

        <p class="detalle-marca">
          ${escaparHTML(p.marca)}
        </p>

        <h2>${escaparHTML(p.nombre)}</h2>

        <div class="badges-dinamicos">

          ${oferta ? '<span class="badge">OFERTA</span>' : ""}

          ${agotado
            ? '<span class="badge stock-agotado">⏳ Agotado</span>'
            : '<span class="badge">Disponible</span>'
          }

        </div>

        <p class="precio">

          ${oferta && p.precioAnterior > 0
            ? `<span class="precio-anterior">
                ${formatearPrecio(p.precioAnterior)}
               </span>`
            : ""
          }

          <span class="precio-dinamico">
            ${formatearPrecio(p.precio)}
          </span>

        </p>

        <p class="detalle-cantidad">
          📦 ${escaparHTML(p.cantidad)}
        </p>

        <div class="detalle-descripcion">
          <h3>💖 Descripción</h3>
          <p>${escaparHTML(p.descripcion || "Información próximamente.")}</p>
        </div>

        <div class="detalle-uso">
          <h3>🧴 ¿Cómo usarlo?</h3>
          <p>${escaparHTML(
            p.uso && p.uso !== "0"
              ? p.uso
              : "Consulta las indicaciones del fabricante."
          )}</p>
        </div>

        <div class="detalle-caracteristicas">
          <p><strong>Tipo de piel:</strong> ${escaparHTML(p.piel.join(", ") || "No especificado")}</p>
          <p><strong>Beneficios:</strong> ${escaparHTML(p.problema.join(", ") || "No especificado")}</p>
        </div>

        <div class="detalle-botones">

          ${agotado
            ? `
              <button class="btn-agotado" disabled>
                ⏳ Temporalmente agotado
              </button>
            `
            : `
              <button onclick="agregarAlCarrito(${index});">
                🛒 Agregar al carrito
              </button>

              <button onclick="pedirProducto(${index})">
                💬 Pedir por WhatsApp
              </button>
            `
          }

          <button onclick="compartirProducto('${encodeURIComponent(p.id)}')">
            ↗ Compartir producto
          </button>

        </div>

      </div>

    </div>
  `;

  modal.style.display = "block";
  modal.style.pointerEvents = "auto";

  // Actualizar el enlace sin recargar el catálogo
  const url = new URL(window.location.href);
  url.searchParams.set("producto", p.id);
  history.replaceState({}, "", url);
}

function cerrarDetalle() {

  const modal = document.getElementById("modalDetalle");

  if (!modal) return;

  modal.style.display = "none";
  modal.style.pointerEvents = "none";

  const url = new URL(window.location.href);
  url.searchParams.delete("producto");
  history.replaceState({}, "", url);
}

// ============================================
// ENLACES DIRECTOS Y COMPARTIR PRODUCTOS
// ============================================

function abrirProductoDesdeEnlace() {

  const parametros = new URLSearchParams(window.location.search);
  const id = parametros.get("producto");

  if (!id) return;

  const index = productos.findIndex(
    p => p.id === id
  );

  if (index !== -1) {
    verDetalle(index);
  }
}

function compartirProducto(id) {

  const url = new URL(window.location.href);

  url.searchParams.set("producto", decodeURIComponent(id));

  const enlace = url.toString();

  if (navigator.share) {

    navigator.share({
      title: "K-arita Bonita",
      text: "Mira este producto de skincare 💗",
      url: enlace
    }).catch(error => {
      if (error.name !== "AbortError") {
        copiarEnlace(enlace);
      }
    });

  } else {
    copiarEnlace(enlace);
  }
}

function copiarEnlace(enlace) {

  if (navigator.clipboard && window.isSecureContext) {

    navigator.clipboard.writeText(enlace)
      .then(() => mostrarToast("¡Enlace copiado! 💗"))
      .catch(() => mostrarToast("No se pudo copiar el enlace"));

  } else {

    const auxiliar = document.createElement("textarea");

    auxiliar.value = enlace;
    document.body.appendChild(auxiliar);
    auxiliar.select();

    try {
      document.execCommand("copy");
      mostrarToast("¡Enlace copiado! 💗");
    } catch (error) {
      mostrarToast("No se pudo copiar el enlace");
    }

    auxiliar.remove();
  }
}

// ============================================
// INFORMACIÓN DEL PEDIDO
// ============================================

function mostrarInfoPedido() {

  const contenedor = document.getElementById("infoPedido");

  if (!contenedor) return;

  if (!pedidoAbierto) {

    contenedor.innerHTML = `
      <div class="info-box">

        <p>🛍️ Productos importados desde Corea</p>

        <p>⏸️ Actualmente no hay pedido abierto</p>

        <p>💬 Escríbeme por WhatsApp para consultar disponibilidad</p>

        <p>📦 Tiempo de entrega: 20 a 25 días hábiles</p>

      </div>
    `;

    return;
  }

  contenedor.innerHTML = `
    <div class="info-box">

      <p>🛍️ Productos sobre pedido desde Corea</p>

      <p>
        ⏳ Próximo pedido cierra:
        <strong>${escaparHTML(fechaCierreManual)}</strong>
      </p>

      <p>📦 Tiempo de entrega: 20 a 25 días hábiles</p>

    </div>
  `;
}

// ============================================
// MENSAJE EMERGENTE
// ============================================

function mostrarToast(mensaje) {

  const toast = document.getElementById("toast");

  if (!toast) return;

  toast.textContent = mensaje;
  toast.classList.add("show");

  clearTimeout(toast._temporizador);

  toast._temporizador = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

// ============================================
// EVENTOS DE LOS MODALES Y BOTONES
// ============================================

function iniciarEventos() {

  const btnCarrito = document.getElementById("btnCarrito");

  if (btnCarrito) {
    btnCarrito.addEventListener("click", abrirCarrito);
  }

  const btnWhatsApp = document.getElementById("btnWhatsApp");

  if (btnWhatsApp) {
    btnWhatsApp.addEventListener("click", function(e) {
      e.preventDefault();
      enviarConsulta();
    });
  }

  const cerrarCarritoBtn = document.getElementById("cerrarCarrito");

  if (cerrarCarritoBtn) {
    cerrarCarritoBtn.addEventListener("click", cerrarCarrito);
  }

  const cerrarDetalleBtn = document.getElementById("cerrarDetalle");

  if (cerrarDetalleBtn) {
    cerrarDetalleBtn.addEventListener("click", cerrarDetalle);
  }

  window.addEventListener("click", function(e) {

    const modalCarrito = document.getElementById("modalCarrito");
    const modalDetalle = document.getElementById("modalDetalle");

    if (e.target === modalCarrito) {
      cerrarCarrito();
    }

    if (e.target === modalDetalle) {
      cerrarDetalle();
    }
  });

  document.addEventListener("keydown", function(e) {

    if (e.key === "Escape") {
      cerrarCarrito();
      cerrarDetalle();
    }
  });
}

// ============================================
// INICIAR CATÁLOGO
// ============================================

document.addEventListener("DOMContentLoaded", function() {

  iniciarFiltros();
  iniciarEventos();
  cargarProductos();
  cargarRutinas();

});

function seleccionarCategoriaPrincipal(categoria) {

  window.location.href =
    "catalogo.html?categoria=" + encodeURIComponent(categoria);

}

// ABRIR Y CERRAR BUSCADOR DEL ENCABEZADO
function alternarBuscador() {

  const contenedor = document.getElementById("buscadorHeader");
  const input = document.getElementById("busqueda");
  const boton = document.getElementById("botonLupa");

  if (!contenedor || !input) return;

  const abierto = contenedor.classList.toggle("abierto");

  if (boton) {
    boton.setAttribute("aria-expanded", String(abierto));
    boton.setAttribute(
      "aria-label",
      abierto ? "Cerrar buscador" : "Abrir buscador"
    );
  }

  if (abierto) {
    input.focus();
  } else {
    input.value = "";
    filtrar();
  }

}

function mostrarSoloOfertas(event) {

  if (event) event.preventDefault();

  const productosOferta = productos.filter(p =>
    esSi(p.oferta)
  );

  mostrarProductos(productosOferta);

  document.getElementById("catalogo")?.scrollIntoView({
    behavior: "smooth"
  });

}

document.addEventListener("DOMContentLoaded", () => {
  actualizarContador();
});
