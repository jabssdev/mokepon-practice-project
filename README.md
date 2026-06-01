# 🔥💧🌱 Mokepon

Un juego de batalla por turnos inspirado en Pokémon, desarrollado con JavaScript vanilla, HTML Canvas y un servidor Node.js con Express. Elige tu criatura, explora el mapa para encontrar rivales y enfréntate en combates estratégicos basados en el sistema piedra-papel-tijera de elementos.

![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-Canvas-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-Responsive-1572B6?logo=css3&logoColor=white)

---

## 🎮 ¿Cómo funciona?

### 1. Selección de Mokepon
Elige entre tres criaturas, cada una con un tipo elemental distinto:

| Mokepon | Tipo | Elemento |
|---------|------|----------|
| **Hipodoge** | 💧 Agua | Fuerte contra Fuego |
| **Capipepo** | 🌱 Tierra | Fuerte contra Agua |
| **Ratigueya** | 🔥 Fuego | Fuerte contra Tierra |

### 2. Exploración del mapa
Tu Mokepon aparece en un mapa renderizado con **HTML Canvas**. Muévete con las flechas del teclado (`↑ ↓ ← →`), las teclas `W A S D`, o los botones en pantalla (compatibles con pantallas táctiles). Cuando colisiones con un rival, ¡comienza la batalla!

### 3. Combate por turnos
Selecciona **5 ataques** de entre tu repertorio (3 de tu tipo principal + 1 de cada tipo secundario). Tu oponente hace lo mismo. Los ataques se resuelven ronda por ronda con el sistema de ventajas elementales. ¡Quien gane más rondas, gana el combate!

---

## 🛠️ Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Canvas**: Renderizado del mapa y sprites de los Mokepones
- **Backend**: Node.js con Express
- **Comunicación**: API REST con `fetch` (JSON)
- **Multiplayer**: Soporte básico multijugador en red local vía servidor

---

## 🚀 Instalación y ejecución

### Prerrequisitos

- [Node.js](https://nodejs.org/) (v18 o superior recomendado)

### Pasos

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/mokepon.git
   cd mokepon
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```

3. **Inicia el servidor**
   ```bash
   node index.js
   ```

4. **Abre el juego**
   
   Abre `mokepon.html` en tu navegador. El servidor corre en `http://localhost:3000`.

---

## 📁 Estructura del proyecto

```
mokepon/
├── assets/               # Sprites e imágenes del juego
│   ├── capipepo.png
│   ├── capipepo_head.png
│   ├── hipodoge.png
│   ├── hipodoge_head.png
│   ├── mokemap.png
│   ├── ratigueya.png
│   └── ratigueya_head.png
├── css/
│   └── style.css         # Estilos del juego (responsive)
├── js/
│   └── mokepon.js        # Lógica del cliente (clases, canvas, combate)
├── index.js              # Servidor Express (API REST)
├── mokepon.html          # Punto de entrada del juego
├── package.json
└── .gitignore
```

---

## 🔌 API del servidor

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/join` | Registra un nuevo jugador y devuelve su ID |
| `POST` | `/mokepon/:id` | Asigna un Mokepon al jugador |
| `POST` | `/mokepon/:id/posicion` | Actualiza la posición en el mapa y recibe la lista de enemigos |
| `POST` | `/mokepon/:id/colision` | Notifica una colisión entre dos jugadores |
| `POST` | `/mokepon/:id/ataques` | Envía los ataques seleccionados |
| `GET` | `/mokepon/:id/ataques` | Obtiene los ataques del oponente |

---

## ✨ Características destacadas

- **Programación orientada a objetos** con clases ES6 (`Mokepon`, `Jugador`)
- **Constantes inmutables** con `Object.freeze` para tipos de ataque y ventajas
- **Renderizado con Canvas API** y animaciones con `requestAnimationFrame`
- **Sistema de colisiones** con detección AABB y margen de spawn
- **Efecto visual glow** para distinguir al jugador en el mapa
- **Canvas responsive** que se adapta al ancho de la ventana
- **Soporte táctil** para dispositivos móviles
- **Throttling** en el envío de posiciones al servidor (100ms)
- **Diseño responsive** con media queries

---

## 📝 Nota

Este proyecto está basado en el concepto del curso de **Programación Básica** de Platzi. Sin embargo, la implementación es propia: la arquitectura del código, las decisiones de diseño y la lógica están escritas desde mi perspectiva y criterio personal.

---

## 📄 Licencia

ISC
