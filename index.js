const express = require("express");
const cors = require("cors");
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const jugadores = [];

class Jugador {
	constructor(id) {
		this.id = id;
		this.ataques = [];
		this.enemigoId = null;
	}

	asignarMokepon(mokepon) {
		this.mokepon = mokepon;
	}

	actualizarPosicion(x, y) {
		this.x = x;
		this.y = y;
	}

	asignarAtaques(ataques) {
		this.ataques = ataques;
	}
}

class Mokepon {
	constructor(nombre) {
		this.nombre = nombre;
	}
}

app.get("/join", (_, res) => {
	const id = `${Date.now()}`;
	const jugador = new Jugador(id);

	jugadores.push(jugador);

	res.send(id);
});

app.post("/mokepon/:id", (req, res) => {
	const playerId = req.params.id || "";
	const mokeponNombre = req.body.mokepon || "";
	const mokepon = new Mokepon(mokeponNombre);

	const player = jugadores.find((jugador) => jugador.id === playerId);

	if (!player) {
		return res.status(400).send("Jugador no encontrado");
	}

	player.asignarMokepon(mokepon);

	res.end();
});

app.post("/mokepon/:id/posicion", (req, res) => {
	const playerId = req.params.id || "";
	const x = req.body.x || 0;
	const y = req.body.y || 0;

	const player = jugadores.find((jugador) => jugador.id === playerId);

	if (!player) {
		return res.status(400).send("Jugador no encontrado");
	}

	player.actualizarPosicion(x, y);

	const enemigos = jugadores.filter((jugador) => jugador.id !== playerId);

	res.send({
		enemigos,
		enemigoId: player.enemigoId || null
	});
});

app.post("/mokepon/:id/colision", (req, res) => {
	const playerId = req.params.id || "";
	const enemigoId = req.body.enemigoId || "";

	const player = jugadores.find((jugador) => jugador.id === playerId);
	const enemigo = jugadores.find((jugador) => jugador.id === enemigoId);

	if (player && enemigo) {
		player.enemigoId = enemigoId;
		enemigo.enemigoId = playerId;
	}

	res.end();
});

app.post("/mokepon/:id/ataques", (req, res) => {
	const playerId = req.params.id || "";
	const ataques = req.body.ataques || [];

	const player = jugadores.find((jugador) => jugador.id === playerId);

	if (!player) {
		return res.status(400).send("Jugador no encontrado");
	}

	player.asignarAtaques(ataques);

	res.end();
});

app.get("/mokepon/:id/ataques", (req, res) => {
	const playerId = req.params.id || "";
	const player = jugadores.find((jugador) => jugador.id === playerId);

	if (!player) {
		return res.status(400).send("Jugador no encontrado");
	}

	res.send({
		ataques: player.ataques || []
	});
});

app.listen(port, () => {
	console.log(`Server started on port ${port}`);
});
