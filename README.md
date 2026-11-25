# 🦢 Origami 3D — Plataforma Interactiva de Aprendizaje

Plataforma web Full Stack diseñada para enseñar el arte del origami mediante guías paso a paso y modelos tridimensionales interactivos. Cuenta con una arquitectura desacoplada, persistencia de datos relacional y dos CRUDs completos conectados a través de una API REST moderna.

---

## 🚀 Características Principales

* **Visor 3D Interactivo:** Renderizado en tiempo real de figuras de origami mediante **Three.js** con controles orbitales (rotar, hacer zoom e inspeccionar el plegado desde cualquier ángulo).
* **2 CRUDs Completos:**
  * **CRUD 1 (Origamis):** Crear, consultar, buscar/filtrar, actualizar y eliminar figuras de origami.
  * **CRUD 2 (Pasos de Plegado):** Gestión completa de la secuencia paso a paso (título, instrucciones y orden de ejecución) vinculada a cada figura.
* **Consumo API con `fetch`:** Implementación modular en el cliente de los 5 métodos estándar HTTP (`GET`, `POST`, `PUT`, `DELETE` y `GET por ID`).
* **Generador Inteligente de Tutoriales:** Motor interno procedural capaz de crear figuras y tutoriales de plegado estructurados automáticamente.
* **Suite de Pruebas Automatizadas:** 11 pruebas de integración para validar el funcionamiento de todos los endpoints de la API en consola.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Frontend** | React 18, Vite, Three.js, HTML5, CSS3 |
| **Backend** | Node.js, Express.js, CORS, Dotenv |
| **Base de Datos** | PostgreSQL (relacional con integridad referencial) |
| **Testing** | Node Test Runner / Suite nativa de integración con `fetch` |

---

## 📡 Endpoints de la API REST

Base URL: `http://localhost:3001/api`

### 📄 CRUD 1: Origamis
| Método | Endpoint | Descripción | Cuerpo (Body) de ejemplo |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/origamis` | Listar origamis (filtros: `?q=`, `?categoria=`, `?dificultad=`) | - |
| **GET** | `/api/origamis/:id` | Obtener una figura con todos sus pasos y modelo 3D | - |
| **POST** | `/api/origamis` | Crear un nuevo origami en la base de datos | `{"nombre": "Cisne", "categoria": "Animales", "dificultad": "Fácil", "descripcion": "Figura elegante", "materiales": "1 hoja"}` |
| **PUT** | `/api/origamis/:id` | Actualizar los datos de una figura existente | `{"dificultad": "Intermedio", "descripcion": "Nueva descripción"}` |
| **DELETE** | `/api/origamis/:id` | Eliminar una figura y sus pasos asociados | - |

### 🪜 CRUD 2: Pasos
| Método | Endpoint | Descripción | Cuerpo (Body) de ejemplo |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/origamis/:id/pasos` | Listar todos los pasos de una figura específica | - |
| **GET** | `/api/pasos/:id` | Consultar el detalle de un paso individual | - |
| **POST** | `/api/origamis/:id/pasos` | Agregar un nuevo paso a la secuencia de un origami | `{"titulo": "Pliegue diagonal", "instruccion": "Dobla de esquina a esquina"}` |
| **POST** | `/api/pasos` | Crear un paso indicando `origami_id` en el cuerpo | `{"origami_id": 1, "titulo": "Paso extra", "instruccion": "..."}` |
| **PUT** | `/api/pasos/:id` | Modificar la instrucción o título de un paso | `{"titulo": "Título corregido", "instruccion": "Nueva instrucción"}` |
| **DELETE** | `/api/pasos/:id` | Eliminar un paso específico | - |

---

## ⚙️ Instalación y Puesta en Marcha

### Prerrequisitos
* Node.js (v18 o superior)
* PostgreSQL instalado y con una base de datos llamada `origami`

### 1. Clonar el repositorio
```bash
git clone https://github.com/TU_USUARIO/origami-3d.git
cd origami-3d
```

### 2. Configurar variables de entorno
Crea un archivo `.env` dentro de la carpeta `backend/` basándote en `.env.example`:
```env
PORT=3001
DB_TYPE=postgres
DATABASE_URL=postgres://postgres:TU_CONTRASEÑA@localhost:5432/origami
```

### 3. Backend (carpeta `backend`)
```bash
cd backend
npm install
npm run seed     # Crea tablas e inserta figuras base iniciales
node server.js   # Inicia el servidor en http://localhost:3001
```

### 4. Frontend (carpeta `frontend`)
En otra terminal:
```bash
cd frontend
npm install
npm run dev      # Inicia Vite en http://localhost:5173
```

---

## 🧪 Pruebas Automatizadas de la API
Para verificar que ambos CRUDs funcionen correctamente:
```bash
cd backend
npm run test:api
```
*(Ejecuta 11 pruebas automáticas cubriendo GET, POST, PUT y DELETE para ambas entidades).*
