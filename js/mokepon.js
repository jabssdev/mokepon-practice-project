// constantes y configuración

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
const DISTANCIA_MINIMA_SPAWN = TAMANO_MOKEPON * 1.5;
const COLOR_GLOW_JUGADOR = "#00e5ff";
const INTENSIDAD_GLOW = 14;

function calcularDimensionesCanvas() {
	let ancho = window.innerWidth - 20;
	let alto = ancho * (300 / 400);

	if (ancho > 400) {
		ancho = 400;
		alto = 300;
	}

	return { ancho, alto };
}

// mokepones data

const MOKEPONES_DATA = Object.freeze([
	{ nombre: "Hipodoge", foto: "./assets/hipodoge.png", tipo: TIPO_ATAQUE.AGUA, fotoMapa: "./assets/hipodoge_head.png" },
	{ nombre: "Capipepo", foto: "./assets/capipepo.png", tipo: TIPO_ATAQUE.TIERRA, fotoMapa: "./assets/capipepo_head.png" },
	{ nombre: "Ratigueya", foto: "./assets/ratigueya.png", tipo: TIPO_ATAQUE.FUEGO, fotoMapa: "./assets/ratigueya_head.png" },
]);

// mokepon class

class Mokepon {
	constructor(nombre, foto, tipoPrincipal, fotoMapa) {
		this.nombre = nombre;
		this.foto = foto;
		this.tipoPrincipal = tipoPrincipal;
		this.mapaFoto = new Image();
		this.mapaFoto.src = fotoMapa;
		this.ataques = this.#generarAtaques();
		this.ancho = TAMANO_MOKEPON;
		this.alto = TAMANO_MOKEPON;
		this.x = 0;
		this.y = 0;
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

	posicionarAleatoriamente(anchoCanvas, altoCanvas, evitar = []) {
		const maxIntentos = 100;

		for (let i = 0; i < maxIntentos; i++) {
			this.x = aleatorio(0, anchoCanvas - this.ancho);
			this.y = aleatorio(0, altoCanvas - this.alto);

			const sinColision = evitar.every((otro) => !this.hayColisionConMargen(otro, DISTANCIA_MINIMA_SPAWN));

			if (sinColision) return;
		}
	}

	pintar(ctx, esJugador = false) {
		if (esJugador) {
			ctx.save();
			ctx.shadowColor = COLOR_GLOW_JUGADOR;
			ctx.shadowBlur = INTENSIDAD_GLOW;
		}

		ctx.drawImage(this.mapaFoto, this.x, this.y, this.ancho, this.alto);

		if (esJugador) {
			ctx.restore();
		}
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
		return this.hayColisionConMargen(enemigo, 0);
	}

	hayColisionConMargen(otro, margen) {
		return !(this.y + this.alto + margen < otro.y || this.y > otro.y + otro.alto + margen || this.x + this.ancho + margen < otro.x || this.x > otro.x + otro.ancho + margen);
	}
}

// factories

function crearMokeponDesdeData(data) {
	return new Mokepon(data.nombre, data.foto, data.tipo, data.fotoMapa);
}

function crearEnemigos(anchoCanvas, altoCanvas, jugador) {
	const enemigos = [];

	for (const data of MOKEPONES_DATA) {
		const enemigo = crearMokeponDesdeData(data);
		enemigo.posicionarAleatoriamente(anchoCanvas, altoCanvas, [jugador, ...enemigos]);
		enemigos.push(enemigo);
	}

	return enemigos;
}

// game state

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
		playerId: null,
	};
}

let estado = crearEstadoInicial();
let ultimoEnvioPosicion = 0;
let intervaloAtaques;

// dom elements

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

// game initialization

function iniciarJuego() {
	cachearElementosDOM();

	DOM.sectionSeleccionarAtaque.style.display = "none";
	DOM.sectionReiniciar.style.display = "none";
	DOM.sectionVerMapa.style.display = "none";

	renderizarTarjetasMokepones();

	DOM.botonMascota.addEventListener("click", seleccionarMascotaJugador);
	DOM.botonReiniciar.addEventListener("click", reiniciarJuego);

	registrarEventosMovimiento();

	joinGame();
}

function joinGame() {
	fetch("http://localhost:3000/join")
		.then((res) => res.text())
		.then((id) => {
			estado.playerId = id;
		})
		.catch((err) => {
			console.error(err);
		});
}

// controles

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

// renderizado

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

// selección de mascota

function seleccionarMascotaJugador() {
	const seleccionado = document.querySelector('input[name="mascota"]:checked');

	if (!seleccionado) {
		alert("Por favor, selecciona una mascota");
		return;
	}

	const plantilla = MOKEPONES_DATA.find((data) => data.nombre.toLowerCase() === seleccionado.id);

	estado.mascotaJugador = crearMokeponDesdeData(plantilla);
	DOM.mascotaJugador.textContent = estado.mascotaJugador.nombre;

	seleccionarMokepon(estado.mascotaJugador.nombre);

	renderizarBotonesAtaque(estado.mascotaJugador.ataques);
	registrarEventosAtaque();

	DOM.sectionSeleccionarMascota.style.display = "none";
	DOM.sectionVerMapa.style.display = "flex";

	configurarCanvas();
	iniciarMapa();
}

function seleccionarMokepon(nombreMokepon) {
	fetch(`http://localhost:3000/mokepon/${estado.playerId}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			mokepon: nombreMokepon,
		}),
	});
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
}

// mapa

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

	estado.mascotaJugador.pintar(estado.ctx, true);

	enviarPosicion(estado.mascotaJugador.x, estado.mascotaJugador.y);

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

function enviarPosicion(x, y) {
	if (!estado.playerId) return;

	const ahora = Date.now();
	if (ahora - ultimoEnvioPosicion < 100) return;
	ultimoEnvioPosicion = ahora;

	fetch(`http://localhost:3000/mokepon/${estado.playerId}/posicion`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ x, y }),
	})
		.then((res) => res.json())
		.then(({ enemigos, enemigoId }) => {
			actualizarEnemigosEnMapa(enemigos);

			if (enemigoId && !estado.colisionDetectada) {
				estado.colisionDetectada = true;
				let enemigo = estado.enemigosEnMapa.find((e) => e.id === enemigoId);
				if (!enemigo) {
					const datosEnemigoServidor = enemigos.find((e) => e.id === enemigoId);
					if (datosEnemigoServidor && datosEnemigoServidor.mokepon) {
						const plantilla = MOKEPONES_DATA.find((data) => data.nombre === datosEnemigoServidor.mokepon.nombre);
						if (plantilla) {
							enemigo = crearMokeponDesdeData(plantilla);
							enemigo.id = enemigoId;
						}
					}
				}
				if (enemigo) {
					manejarColisionRecibida(enemigo);
				} else {
					estado.colisionDetectada = false;
				}
			}
		})
		.catch((err) => console.error("Error enviando posición:", err));
}

function actualizarEnemigosEnMapa(enemigosServidor) {
	estado.enemigosEnMapa = enemigosServidor
		.filter((e) => e.mokepon)
		.map((e) => {
			const plantilla = MOKEPONES_DATA.find((data) => data.nombre === e.mokepon.nombre);

			if (!plantilla) return null;

			const enemigo = estado.enemigosEnMapa.find((actual) => actual.id === e.id) || crearMokeponDesdeData(plantilla);

			enemigo.id = e.id;
			enemigo.x = e.x ?? enemigo.x;
			enemigo.y = e.y ?? enemigo.y;

			return enemigo;
		})
		.filter(Boolean);
}

function manejarColision(enemigo) {
	detenerMovimiento();
	detenerMapa();

	estado.mascotaEnemigo = enemigo;
	DOM.mascotaEnemigo.textContent = enemigo.nombre;

	DOM.sectionVerMapa.style.display = "none";
	DOM.sectionSeleccionarAtaque.style.display = "flex";

	notificarColision(enemigo.id);
}

function manejarColisionRecibida(enemigo) {
	detenerMovimiento();
	detenerMapa();

	estado.mascotaEnemigo = enemigo;
	DOM.mascotaEnemigo.textContent = enemigo.nombre;

	DOM.sectionVerMapa.style.display = "none";
	DOM.sectionSeleccionarAtaque.style.display = "flex";
}

function notificarColision(enemigoId) {
	fetch(`http://localhost:3000/mokepon/${estado.playerId}/colision`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ enemigoId }),
	}).catch((err) => console.error("Error al notificar colisión:", err));
}

// ataque system

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

	if (estado.ataquesJugador.length === TOTAL_RONDAS) {
		enviarAtaques();
	}
}

function enviarAtaques() {
	DOM.resultado.innerHTML = "Esperando los ataques del enemigo...";

	fetch(`http://localhost:3000/mokepon/${estado.playerId}/ataques`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			ataques: estado.ataquesJugador,
		}),
	})
		.then(() => {
			intervaloAtaques = setInterval(obtenerAtaquesEnemigo, 1000);
		})
		.catch((err) => {
			console.error("Error al enviar ataques:", err);
			DOM.resultado.innerHTML = "Error al enviar los ataques";
		});
}

function obtenerAtaquesEnemigo() {
	const enemigoId = estado.mascotaEnemigo?.id;
	if (!enemigoId) return;

	fetch(`http://localhost:3000/mokepon/${enemigoId}/ataques`)
		.then((res) => {
			if (!res.ok) {
				throw new Error("Error al obtener ataques del enemigo");
			}
			return res.json();
		})
		.then(({ ataques }) => {
			if (ataques.length === TOTAL_RONDAS) {
				clearInterval(intervaloAtaques);
				estado.ataquesEnemigo = ataques;
				combate();
			}
		})
		.catch((err) => console.error("Error al obtener ataques:", err));
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

// utilities

function reiniciarJuego() {
	location.reload();
}

function aleatorio(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

window.addEventListener("load", iniciarJuego);
