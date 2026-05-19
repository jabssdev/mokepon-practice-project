// CONSTANTES Y CONFIGURACIÓN

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
const TAMANO_MOKEPON = 50;

function calcularDimensionesCanvas() {
	let ancho = window.innerWidth - 20;
	let alto = ancho * (300 / 400);

	if (ancho > 400) {
		ancho = 400;
		alto = 300;
	}

	return { ancho, alto };
}

// DATOS BASE DE MOKEPONES

const MOKEPONES_DATA = Object.freeze([
	{ nombre: "Hipodoge", foto: "./assets/hipodoge.png", tipo: TIPO_ATAQUE.AGUA, fotoMapa: "./assets/hipodoge_head.png" },
	{ nombre: "Capipepo", foto: "./assets/capipepo.png", tipo: TIPO_ATAQUE.TIERRA, fotoMapa: "./assets/capipepo_head.png" },
	{ nombre: "Ratigueya", foto: "./assets/ratigueya.png", tipo: TIPO_ATAQUE.FUEGO, fotoMapa: "./assets/ratigueya_head.png" },
]);

// CLASE MOKEPON

class Mokepon {
	constructor(nombre, foto, tipoPrincipal, fotoMapa) {
		this.nombre = nombre;
		this.foto = foto;
		this.tipoPrincipal = tipoPrincipal;
		this.ataques = this.#generarAtaques();
		this.ancho = TAMANO_MOKEPON;
		this.alto = TAMANO_MOKEPON;
		this.x = 0;
		this.y = 0;
		this.mapaFoto = new Image();
		this.mapaFoto.src = fotoMapa;
		this.velocidadX = 0;
		this.velocidadY = 0;
	}

	#generarAtaques() {
		const tiposSecundarios = Object.values(TIPO_ATAQUE).filter((tipo) => tipo !== this.tipoPrincipal);

		return [
			...Array(3)
				.fill(null)
				.map(() => this.#crearAtaque(this.tipoPrincipal)),
			...tiposSecundarios.map((tipo) => this.#crearAtaque(tipo)),
		];
	}

	#crearAtaque(tipo) {
		return { tipo, emoji: EMOJI_ATAQUE[tipo] };
	}

	posicionarAleatoriamente(anchoCanvas, altoCanvas) {
		this.x = aleatorio(0, anchoCanvas - this.ancho);
		this.y = aleatorio(0, altoCanvas - this.alto);
	}

	pintar(ctx) {
		ctx.drawImage(this.mapaFoto, this.x, this.y, this.ancho, this.alto);
	}

	actualizarPosicion(anchoCanvas, altoCanvas) {
		this.x = Math.max(0, Math.min(this.x + this.velocidadX, anchoCanvas - this.ancho));
		this.y = Math.max(0, Math.min(this.y + this.velocidadY, altoCanvas - this.alto));
	}

	detener() {
		this.velocidadX = 0;
		this.velocidadY = 0;
	}

	hayColision(enemigo) {
		const derecha = this.x + this.ancho;
		const abajo = this.y + this.alto;
		const derechaEnemigo = enemigo.x + enemigo.ancho;
		const abajoEnemigo = enemigo.y + enemigo.alto;

		return !(abajo < enemigo.y || this.y > abajoEnemigo || derecha < enemigo.x || this.x > derechaEnemigo);
	}
}

// FACTORIES — Crean instancias frescas de Mokepones

function crearMokeponDesdeData(data) {
	return new Mokepon(data.nombre, data.foto, data.tipo, data.fotoMapa);
}

function crearEnemigos(anchoCanvas, altoCanvas) {
	return MOKEPONES_DATA.map((data) => {
		const enemigo = crearMokeponDesdeData(data);
		enemigo.posicionarAleatoriamente(anchoCanvas, altoCanvas);
		return enemigo;
	});
}

// ESTADO DEL JUEGO

function crearEstadoInicial() {
	return {
		mascotaJugador: null,
		mascotaEnemigo: null,
		enemigosEnMapa: [],
		ataquesJugador: [],
		ataquesEnemigo: [],
		victoriasJugador: 0,
		victoriasEnemigo: 0,
		ctx: null,
		intervalo: null,
		mapaBackground: null,
		colisionDetectada: false,
		canvasAncho: 0,
		canvasAlto: 0,
	};
}

let estado = crearEstadoInicial();

// ELEMENTOS DEL DOM

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

// INICIALIZACIÓN DEL JUEGO

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

// CONTROLES DE MOVIMIENTO

function registrarEventosMovimiento() {
	const controles = [
		{ boton: DOM.botonMoverArriba, vx: 0, vy: -VELOCIDAD_MOVIMIENTO },
		{ boton: DOM.botonMoverAbajo, vx: 0, vy: VELOCIDAD_MOVIMIENTO },
		{ boton: DOM.botonMoverIzquierda, vx: -VELOCIDAD_MOVIMIENTO, vy: 0 },
		{ boton: DOM.botonMoverDerecha, vx: VELOCIDAD_MOVIMIENTO, vy: 0 },
	];

	controles.forEach(({ boton, vx, vy }) => {
		const iniciar = () => {
			if (!estado.mascotaJugador) return;
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

function manejarTeclado(evento) {
	if (!estado.mascotaJugador) return;

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
	if (!estado.mascotaJugador) return;
	estado.mascotaJugador.detener();
}

// RENDERIZADO

function renderizarTarjetasMokepones() {
	const fragment = document.createDocumentFragment();

	MOKEPONES_DATA.forEach((data) => {
		const id = data.nombre.toLowerCase();

		const input = document.createElement("input");
		input.type = "radio";
		input.name = "mascota";
		input.id = id;

		const label = document.createElement("label");
		label.className = "tarjeta-de-mokepon";
		label.htmlFor = id;

		const nombre = document.createElement("p");
		nombre.textContent = data.nombre;

		const img = document.createElement("img");
		img.src = data.foto;
		img.alt = data.nombre;

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

function renderizarRonda(atqJugador, atqEnemigo) {
	const pJugador = document.createElement("p");
	pJugador.textContent = atqJugador;
	DOM.ataquesDelJugador.appendChild(pJugador);

	const pEnemigo = document.createElement("p");
	pEnemigo.textContent = atqEnemigo;
	DOM.ataquesDelEnemigo.appendChild(pEnemigo);
}

// SELECCIÓN DE MASCOTA

function seleccionarMascotaJugador() {
	const seleccionado = document.querySelector('input[name="mascota"]:checked');

	if (!seleccionado) {
		alert("Por favor, selecciona una mascota");
		return;
	}

	const plantilla = MOKEPONES_DATA.find((data) => data.nombre.toLowerCase() === seleccionado.id);

	estado.mascotaJugador = crearMokeponDesdeData(plantilla);
	DOM.mascotaJugador.textContent = estado.mascotaJugador.nombre;

	renderizarBotonesAtaque(estado.mascotaJugador.ataques);
	registrarEventosAtaque();

	DOM.sectionSeleccionarMascota.style.display = "none";
	DOM.sectionVerMapa.style.display = "flex";

	configurarCanvas();
	iniciarMapa();
}

function configurarCanvas() {
	const { ancho, alto } = calcularDimensionesCanvas();
	estado.canvasAncho = ancho;
	estado.canvasAlto = alto;

	DOM.canvas.width = ancho;
	DOM.canvas.height = alto;
	estado.ctx = DOM.canvas.getContext("2d");

	estado.mapaBackground = new Image();
	estado.mapaBackground.src = "./assets/mokemap.png";

	estado.mascotaJugador.posicionarAleatoriamente(ancho, alto);
	estado.enemigosEnMapa = crearEnemigos(ancho, alto);
}

// MAPA Y GAME LOOP

function iniciarMapa() {
	estado.colisionDetectada = false;
	window.addEventListener("keydown", manejarTeclado);
	window.addEventListener("keyup", detenerMovimiento);

	estado.intervalo = requestAnimationFrame(dibujarMapa);
}

function detenerMapa() {
	cancelAnimationFrame(estado.intervalo);
	estado.intervalo = null;
	window.removeEventListener("keydown", manejarTeclado);
	window.removeEventListener("keyup", detenerMovimiento);
}

function dibujarMapa() {
	if (estado.colisionDetectada) return;

	estado.mascotaJugador.actualizarPosicion(estado.canvasAncho, estado.canvasAlto);

	estado.ctx.clearRect(0, 0, DOM.canvas.width, DOM.canvas.height);
	estado.ctx.drawImage(estado.mapaBackground, 0, 0, DOM.canvas.width, DOM.canvas.height);

	estado.mascotaJugador.pintar(estado.ctx);

	for (const enemigo of estado.enemigosEnMapa) {
		enemigo.pintar(estado.ctx);

		if (estado.mascotaJugador.hayColision(enemigo)) {
			estado.colisionDetectada = true;
			manejarColision(enemigo);
			return;
		}
	}

	estado.intervalo = requestAnimationFrame(dibujarMapa);
}

function manejarColision(enemigo) {
	detenerMovimiento();
	detenerMapa();

	estado.mascotaEnemigo = enemigo;
	DOM.mascotaEnemigo.textContent = enemigo.nombre;

	DOM.sectionVerMapa.style.display = "none";
	DOM.sectionSeleccionarAtaque.style.display = "flex";
}

// SISTEMA DE ATAQUES

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

// COMBATE

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

// UTILIDADES

function reiniciarJuego() {
	location.reload();
}

function aleatorio(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

window.addEventListener("load", iniciarJuego);
