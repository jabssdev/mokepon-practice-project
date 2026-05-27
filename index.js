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
	}

	asignarMokepon(mokepon) {
		this.mokepon = mokepon;
	}

	actualizarPosicion(x, y) {
		this.x = x;
		this.y = y;
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

	res.send({ enemigos });
});

app.listen(port, () => {
	console.log(`Server started on port ${port}`);
});
