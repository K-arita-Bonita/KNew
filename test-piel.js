const preguntasPiel = [
  {
    pregunta: "¿Cómo se siente tu piel 30 minutos después de lavarla, sin aplicar productos?",
    opciones: [
      { texto: "Tirante o reseca", tipo: "seca" },
      { texto: "Brillante o grasosa en casi todo el rostro", tipo: "grasa" },
      { texto: "Grasa en la zona T y seca en las mejillas", tipo: "mixta" },
      { texto: "Cómoda, sin mucha grasa ni tirantez", tipo: "normal" }
    ]
  },
  {
    pregunta: "¿En qué partes de tu rostro notas más brillo?",
    opciones: [
      { texto: "Casi nunca tengo brillo", tipo: "seca" },
      { texto: "En todo el rostro", tipo: "grasa" },
      { texto: "En frente, nariz y mentón", tipo: "mixta" },
      { texto: "Un poco al final del día", tipo: "normal" }
    ]
  },
  {
    pregunta: "¿Cómo notas tus poros?",
    opciones: [
      { texto: "Poco visibles", tipo: "seca" },
      { texto: "Visibles en gran parte del rostro", tipo: "grasa" },
      { texto: "Más visibles en nariz y frente", tipo: "mixta" },
      { texto: "Discretos y bastante uniformes", tipo: "normal" }
    ]
  },
  {
    pregunta: "¿Con qué frecuencia sientes tirantez o resequedad?",
    opciones: [
      { texto: "Muy frecuentemente", tipo: "seca" },
      { texto: "Casi nunca", tipo: "grasa" },
      { texto: "Principalmente en las mejillas", tipo: "mixta" },
      { texto: "Solo ocasionalmente", tipo: "normal" }
    ]
  },
  {
    pregunta: "¿Cómo se comporta tu piel durante el día?",
    opciones: [
      { texto: "Se mantiene seca y necesita hidratación", tipo: "seca" },
      { texto: "Produce grasa rápidamente", tipo: "grasa" },
      { texto: "Algunas zonas brillan y otras no", tipo: "mixta" },
      { texto: "Se mantiene bastante equilibrada", tipo: "normal" }
    ]
  },
  {
    pregunta: "¿Qué descripción se parece más a tu piel?",
    opciones: [
      { texto: "Suele sentirse áspera o descamarse", tipo: "seca" },
      { texto: "Suele tener brillo y exceso de sebo", tipo: "grasa" },
      { texto: "Tiene zonas secas y zonas grasas", tipo: "mixta" },
      { texto: "No suele presentar extremos de grasa o sequedad", tipo: "normal" }
    ]
  }
];

const resultadosPiel = {
  seca: {
    titulo: "Tu piel parece ser seca 💧",
    descripcion:
      "Tu piel podría producir menos grasa natural y presentar tirantez. Prioriza una limpieza suave, hidratación y productos que ayuden a mantener la barrera cutánea.",
    filtro: "Seca"
  },
  grasa: {
    titulo: "Tu piel parece ser grasa ✨",
    descripcion:
      "Tu piel podría producir más sebo, especialmente durante el día. Busca limpiadores suaves, hidratantes ligeros y protección solar adecuada.",
    filtro: "Grasa"
  },
  mixta: {
    titulo: "Tu piel parece ser mixta 🌸",
    descripcion:
      "Tu piel podría presentar mayor producción de grasa en la zona T y más sequedad en otras áreas. Una rutina equilibrada puede ayudarte a cuidar ambas zonas.",
    filtro: "Mixta"
  },
  normal: {
    titulo: "Tu piel parece ser normal ♡",
    descripcion:
      "Tu piel parece mantener un equilibrio entre grasa e hidratación. Una rutina sencilla de limpieza, hidratación y protección solar puede ser suficiente.",
    filtro: ""
  }
};

let preguntaActual = 0;
let respuestasPiel = Array(preguntasPiel.length).fill(null);

function mostrarPreguntaPiel() {
  const pregunta = preguntasPiel[preguntaActual];

  document.getElementById("quizNumero").textContent =
    `Pregunta ${preguntaActual + 1} de ${preguntasPiel.length}`;

  document.getElementById("quizProgreso").style.width =
    `${((preguntaActual + 1) / preguntasPiel.length) * 100}%`;

  document.getElementById("quizPregunta").textContent =
    pregunta.pregunta;

  const opciones = document.getElementById("quizOpciones");
  opciones.innerHTML = "";

  pregunta.opciones.forEach((opcion, index) => {
    const boton = document.createElement("button");

    boton.type = "button";
    boton.className = "quiz-opcion";
    boton.textContent = opcion.texto;

    if (respuestasPiel[preguntaActual] === index) {
      boton.classList.add("seleccionada");
    }

    boton.addEventListener("click", () => {
      respuestasPiel[preguntaActual] = index;
      mostrarPreguntaPiel();
    });

    opciones.appendChild(boton);
  });

  document.getElementById("quizAnterior").disabled =
    preguntaActual === 0;

  const siguiente = document.getElementById("quizSiguiente");

  siguiente.disabled = respuestasPiel[preguntaActual] === null;
  siguiente.textContent =
    preguntaActual === preguntasPiel.length - 1
      ? "Ver mi resultado ♡"
      : "Siguiente";
}

function calcularResultadoPiel() {
  const puntos = {
    seca: 0,
    grasa: 0,
    mixta: 0,
    normal: 0
  };

  respuestasPiel.forEach((respuesta, index) => {
    const tipo = preguntasPiel[index].opciones[respuesta].tipo;
    puntos[tipo]++;
  });

  const orden = ["mixta", "seca", "grasa", "normal"];

  const tipoGanador = orden.reduce((mejor, tipo) =>
    puntos[tipo] > puntos[mejor] ? tipo : mejor
  );

  return resultadosPiel[tipoGanador];
}

function mostrarResultadoPiel() {
  const resultado = calcularResultadoPiel();

  document.getElementById("quizContenedor").hidden = true;

  const contenedor = document.getElementById("quizResultado");
  contenedor.hidden = false;

  const enlace = resultado.filtro
    ? `catalogo.html?piel=${encodeURIComponent(resultado.filtro)}`
    : "catalogo.html";

  contenedor.innerHTML = `
    <span class="etiqueta-seccion">YOUR SKIN RESULT</span>
    <h2>${resultado.titulo}</h2>
    <p>${resultado.descripcion}</p>

    <a href="${enlace}">
      Descubrir productos para mi piel →
    </a>

    <button class="quiz-reiniciar" type="button"
      id="reiniciarTestPiel">
      Repetir test
    </button>
  `;

  document.getElementById("reiniciarTestPiel")
    .addEventListener("click", () => {
      preguntaActual = 0;
      respuestasPiel = Array(preguntasPiel.length).fill(null);
      contenedor.hidden = true;
      document.getElementById("quizContenedor").hidden = false;
      mostrarPreguntaPiel();
    });
}

document.addEventListener("DOMContentLoaded", () => {
  const contenedor = document.getElementById("quizContenedor");
  if (!contenedor) return;

  document.getElementById("quizAnterior")
    .addEventListener("click", () => {
      if (preguntaActual > 0) {
        preguntaActual--;
        mostrarPreguntaPiel();
      }
    });

  document.getElementById("quizSiguiente")
    .addEventListener("click", () => {
      if (respuestasPiel[preguntaActual] === null) return;

      if (preguntaActual < preguntasPiel.length - 1) {
        preguntaActual++;
        mostrarPreguntaPiel();
      } else {
        mostrarResultadoPiel();
      }
    });

  mostrarPreguntaPiel();
});