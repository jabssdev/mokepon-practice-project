// constantes

const TIPO_ATAQUE = Object.freeze({
	FUEGO: "FUEGO",
	AGUA: "AGUA",
	TIERRA: "TIERRA",
});

const EMOJI_ATAQUE = Object.freeze({
	[TIPO_ATAQUE.FUEGO]: "🔥",
	[TIPO_ATAQUE.AGUA]: "💧",
	[TIPO_ATAQUE.TIERRA]: "🌱",
});

const MAPA_VENTAJAS = Object.freeze({
	[TIPO_ATAQUE.FUEGO]: TIPO_ATAQUE.TIERRA,
	[TIPO_ATAQUE.AGUA]: TIPO_ATAQUE.FUEGO,
	[TIPO_ATAQUE.TIERRA]: TIPO_ATAQUE.AGUA,
});

const TOTAL_RONDAS = 5;
const VELOCIDAD_MOVIMIENTO = 5;
const CANVAS_ANCHO_MAX = 400;
const CANVAS_ALTO_MAX = 300;

// clase mokepon

class Mokepon {
	constructor(nombre, foto, tipoPrincipal, fotoMapa, x = 20, y = 30) {
		this.nombre = nombre;
		this.foto = foto;
		this.tipoPrincipal = tipoPrincipal;
		this.ataques = this.#generarAtaques();
		this.x = x;
		this.y = y;
		this.ancho = 50;
		this.alto = 50;
		this.mapaFoto = new Image();
		this.mapaFoto.src = fotoMapa;
		this.velocidadX = 0;
		this.velocidadY = 0;
	}

	#generarAtaques() {
		const tiposSecundarios = Object.values(TIPO_ATAQUE).filter((tipo) => tipo !== this.tipoPrincipal);

		const ataques = [
			...Array(3)
				.fill(null)
				.map(() => this.#crearAtaque(this.tipoPrincipal)),
			...tiposSecundarios.map((tipo) => this.#crearAtaque(tipo)),
		];

		return ataques;
	}

	#crearAtaque(tipo) {
		return { tipo, emoji: EMOJI_ATAQUE[tipo] };
	}

	pintar(ctx) {
		ctx.drawImage(this.mapaFoto, this.x, this.y, this.ancho, this.alto);
	}

	actualizarPosicion() {
		this.x += this.velocidadX;
		this.y += this.velocidadY;
	}
}

// datos del juego

const MOKEPONES = Object.freeze([
	new Mokepon("Hipodoge", "./assets/hipodoge.png", TIPO_ATAQUE.AGUA, "./assets/hipodoge_head.png"),
	new Mokepon("Capipepo", "./assets/capipepo.png", TIPO_ATAQUE.TIERRA, "./assets/capipepo_head.png"),
	new Mokepon("Ratigueya", "./assets/ratigueya.png", TIPO_ATAQUE.FUEGO, "./assets/ratigueya_head.png"),
]);

const MOKEPONES_ENEMIGOS = [
	new Mokepon("Hipodoge", "./assets/hipodoge.png", TIPO_ATAQUE.AGUA, "./assets/hipodoge_head.png", 75, 140),
	new Mokepon("Capipepo", "./assets/capipepo.png", TIPO_ATAQUE.TIERRA, "./assets/capipepo_head.png", 240, 210),
	new Mokepon("Ratigueya", "./assets/ratigueya.png", TIPO_ATAQUE.FUEGO, "./assets/ratigueya_head.png", 265, 80),
];

// estado del juego

function crearEstadoInicial() {
	return {
		mascotaJugador: null,
		mascotaEnemigo: null,
		ataquesJugador: [],
		ataquesEnemigo: [],
		victoriasJugador: 0,
		victoriasEnemigo: 0,
		ctx: null,
		intervalo: null,
		mapaBackground: new Image(),
	};
}

let estado = crearEstadoInicial();

// elementos del dom

const DOM = {};

function cachearElementosDOM() {
	DOM.sectionSeleccionarMascota = document.getElementById("seleccionar-mascota");
	DOM.containerTarjetas = document.getElementById("contenedor-tarjetas");
	DOM.containerAtaques = document.getElementById("contenedor-ataques");
	DOM.sectionSeleccionarAtaque = document.getElementById("seleccionar-ataque");
	DOM.ataquesDelJugador = document.getElementById("ataques-del-jugador");
	DOM.ataquesDelEnemigo = document.getElementById("ataques-del-enemigo");
	DOM.resultado = document.getElementById("resultado");
	DOM.sectionReiniciar = document.getElementById("reiniciar");
	DOM.botonMascota = document.getElementById("boton-mascota");
	DOM.botonReiniciar = document.getElementById("boton-reiniciar");
	DOM.mascotaJugador = document.getElementById("mascota-jugador");
	DOM.mascotaEnemigo = document.getElementById("mascota-enemigo");
	DOM.vidasJugador = document.getElementById("vidas-jugador");
	DOM.vidasEnemigo = document.getElementById("vidas-enemigo");
	DOM.sectionVerMapa = document.getElementById("ver-mapa");
	DOM.canvas = document.getElementById("mapa");
	DOM.botonMoverArriba = document.getElementById("boton-mover-arriba");
	DOM.botonMoverAbajo = document.getElementById("boton-mover-abajo");
	DOM.botonMoverIzquierda = document.getElementById("boton-mover-izquierda");
	DOM.botonMoverDerecha = document.getElementById("boton-mover-derecha");
}

// inicializar juego

function iniciarJuego() {
	cachearElementosDOM();

	DOM.sectionSeleccionarAtaque.style.display = "none";
	DOM.sectionReiniciar.style.display = "none";
	DOM.sectionVerMapa.style.display = "none";

	renderizarTarjetasMokepones();

	DOM.botonMascota.addEventListener("click", seleccionarMascotaJugador);
	DOM.botonReiniciar.addEventListener("click", reiniciarJuego);

	registrarEventosMovimiento();
}

function registrarEventosMovimiento() {
	const controles = [
		{ boton: DOM.botonMoverArriba, vx: 0, vy: -VELOCIDAD_MOVIMIENTO },
		{ boton: DOM.botonMoverAbajo, vx: 0, vy: VELOCIDAD_MOVIMIENTO },
		{ boton: DOM.botonMoverIzquierda, vx: -VELOCIDAD_MOVIMIENTO, vy: 0 },
		{ boton: DOM.botonMoverDerecha, vx: VELOCIDAD_MOVIMIENTO, vy: 0 },
	];

	controles.forEach(({ boton, vx, vy }) => {
		const iniciar = () => {
			estado.mascotaJugador.velocidadX = vx;
			estado.mascotaJugador.velocidadY = vy;
		};

		boton.addEventListener("mousedown", iniciar);
		boton.addEventListener("mouseup", detenerMovimiento);
		boton.addEventListener("touchstart", (e) => {
			e.preventDefault();
			iniciar();
		});
		boton.addEventListener("touchend", (e) => {
			e.preventDefault();
			detenerMovimiento();
		});
	});
}

// renderizado

function renderizarTarjetasMokepones() {
	const fragment = document.createDocumentFragment();

	MOKEPONES.forEach((mokepon) => {
		const id = mokepon.nombre.toLowerCase();

		const input = document.createElement("input");
		input.type = "radio";
		input.name = "mascota";
		input.id = id;

		const label = document.createElement("label");
		label.className = "tarjeta-de-mokepon";
		label.htmlFor = id;

		const nombre = document.createElement("p");
		nombre.textContent = mokepon.nombre;

		const img = document.createElement("img");
		img.src = mokepon.foto;
		img.alt = mokepon.nombre;

		label.appendChild(nombre);
		label.appendChild(img);

		fragment.appendChild(input);
		fragment.appendChild(label);
	});

	DOM.containerTarjetas.appendChild(fragment);
}

function renderizarBotonesAtaque(ataques) {
	const fragment = document.createDocumentFragment();

	ataques.forEach((ataque, index) => {
		const boton = document.createElement("button");
		boton.className = "boton-de-ataque";
		boton.id = `boton-ataque-${index}`;
		boton.dataset.tipo = ataque.tipo;
		boton.textContent = ataque.emoji;
		fragment.appendChild(boton);
	});

	DOM.containerAtaques.appendChild(fragment);
}

// seleccionar mascota

function seleccionarMascotaJugador() {
	const seleccionado = document.querySelector('input[name="mascota"]:checked');

	if (!seleccionado) {
		alert("Por favor, selecciona una mascota");
		return;
	}

	const plantilla = MOKEPONES.find((m) => m.nombre.toLowerCase() === seleccionado.id);

	estado.mascotaJugador = new Mokepon(
		plantilla.nombre,
		plantilla.foto,
		plantilla.tipoPrincipal,
		plantilla.mapaFoto.src
	);
	DOM.mascotaJugador.textContent = estado.mascotaJugador.nombre;

	seleccionarMascotaEnemigo();
	renderizarBotonesAtaque(estado.mascotaJugador.ataques);
	registrarEventosAtaque();

	DOM.sectionSeleccionarMascota.style.display = "none";
	DOM.sectionVerMapa.style.display = "flex";

	// Configuración del canvas
	DOM.canvas.width = CANVAS_ANCHO_MAX;
	DOM.canvas.height = CANVAS_ALTO_MAX;
	estado.ctx = DOM.canvas.getContext("2d");
	estado.mapaBackground.src = "./assets/mokemap.png";
	iniciarMapa();
}

function iniciarMapa() {
	window.addEventListener("keydown", manejarTeclado);
	window.addEventListener("keyup", detenerMovimiento);

	estado.intervalo = requestAnimationFrame(dibujarMapa);
}

function dibujarMapa() {
	estado.mascotaJugador.actualizarPosicion();
	estado.ctx.clearRect(0, 0, DOM.canvas.width, DOM.canvas.height);
	estado.ctx.drawImage(estado.mapaBackground, 0, 0, DOM.canvas.width, DOM.canvas.height);
	estado.mascotaJugador.pintar(estado.ctx);

	MOKEPONES_ENEMIGOS.forEach((enemigo) => enemigo.pintar(estado.ctx));

	estado.intervalo = requestAnimationFrame(dibujarMapa);
}

function manejarTeclado(evento) {
	const teclas = {
		ArrowUp: { vx: 0, vy: -VELOCIDAD_MOVIMIENTO },
		ArrowDown: { vx: 0, vy: VELOCIDAD_MOVIMIENTO },
		ArrowLeft: { vx: -VELOCIDAD_MOVIMIENTO, vy: 0 },
		ArrowRight: { vx: VELOCIDAD_MOVIMIENTO, vy: 0 },
		w: { vx: 0, vy: -VELOCIDAD_MOVIMIENTO },
		s: { vx: 0, vy: VELOCIDAD_MOVIMIENTO },
		a: { vx: -VELOCIDAD_MOVIMIENTO, vy: 0 },
		d: { vx: VELOCIDAD_MOVIMIENTO, vy: 0 },
	};

	const movimiento = teclas[evento.key];

	if (movimiento) {
		estado.mascotaJugador.velocidadX = movimiento.vx;
		estado.mascotaJugador.velocidadY = movimiento.vy;
	}
}

function detenerMovimiento() {
	estado.mascotaJugador.velocidadX = 0;
	estado.mascotaJugador.velocidadY = 0;
}

function seleccionarMascotaEnemigo() {
	const indice = aleatorio(0, MOKEPONES.length - 1);
	const plantilla = MOKEPONES[indice];
	estado.mascotaEnemigo = new Mokepon(
		plantilla.nombre,
		plantilla.foto,
		plantilla.tipoPrincipal,
		plantilla.mapaFoto.src
	);
	DOM.mascotaEnemigo.textContent = estado.mascotaEnemigo.nombre;
}

// secuencia de ataques

function registrarEventosAtaque() {
	const botones = DOM.containerAtaques.querySelectorAll(".boton-de-ataque");

	botones.forEach((boton) => {
		boton.addEventListener("click", manejarAtaque);
	});
}

function manejarAtaque(evento) {
	const boton = evento.currentTarget;
	const tipoAtaque = boton.dataset.tipo;

	estado.ataquesJugador.push(tipoAtaque);
	boton.style.backgroundColor = "#112f58";
	boton.disabled = true;

	generarAtaqueEnemigo();

	if (estado.ataquesJugador.length === TOTAL_RONDAS) {
		combate();
	}
}

function generarAtaqueEnemigo() {
	const ataquesEnemigo = estado.mascotaEnemigo.ataques;
	const indice = aleatorio(0, ataquesEnemigo.length - 1);
	estado.ataquesEnemigo.push(ataquesEnemigo[indice].tipo);
}

// combate

function combate() {
	for (let i = 0; i < TOTAL_RONDAS; i++) {
		const atqJugador = estado.ataquesJugador[i];
		const atqEnemigo = estado.ataquesEnemigo[i];
		const resultado = determinarResultado(atqJugador, atqEnemigo);

		if (resultado === "GANASTE") {
			estado.victoriasJugador++;
		} else if (resultado === "PERDISTE") {
			estado.victoriasEnemigo++;
		}

		renderizarRonda(atqJugador, atqEnemigo);
	}

	DOM.vidasJugador.textContent = estado.victoriasJugador;
	DOM.vidasEnemigo.textContent = estado.victoriasEnemigo;

	mostrarResultadoFinal();
}

function determinarResultado(atqJugador, atqEnemigo) {
	if (atqJugador === atqEnemigo) return "EMPATE";
	if (MAPA_VENTAJAS[atqJugador] === atqEnemigo) return "GANASTE";
	return "PERDISTE";
}

function renderizarRonda(atqJugador, atqEnemigo) {
	const pJugador = document.createElement("p");
	pJugador.textContent = atqJugador;
	DOM.ataquesDelJugador.appendChild(pJugador);

	const pEnemigo = document.createElement("p");
	pEnemigo.textContent = atqEnemigo;
	DOM.ataquesDelEnemigo.appendChild(pEnemigo);
}

function mostrarResultadoFinal() {
	const { victoriasJugador, victoriasEnemigo } = estado;
	let mensaje;

	if (victoriasJugador > victoriasEnemigo) {
		mensaje = "¡GANASTE! 🎉";
	} else if (victoriasJugador < victoriasEnemigo) {
		mensaje = "Perdiste 😢";
	} else {
		mensaje = "Es un empate 🤝";
	}

	DOM.resultado.innerHTML = `<strong>${mensaje}</strong>`;
	DOM.sectionReiniciar.style.display = "block";
}

// utilidades

function reiniciarJuego() {
	location.reload();
}

function aleatorio(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

// arranque

window.addEventListener("load", iniciarJuego);
