import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDb, all, get, run, saveOrigami } from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Registro en consola de cada petición en vivo
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`[API ${req.method}] ${req.originalUrl} -> ${res.statusCode} (${ms}ms)`);
  });
  next();
});

// Documentación de la API
app.get('/api', (req, res) => {
  res.json({
    nombre: 'API REST - Origami 3D',
    version: '2.0.0',
    descripcion: 'Backend con soporte completo de 2 CRUDs (Origamis y Pasos)',
    endpoints: {
      origamis: {
        'GET /api/origamis': 'Listar origamis (filtros: ?q=, ?categoria=, ?dificultad=)',
        'GET /api/origamis/:id': 'Obtener un origami con todos sus pasos',
        'POST /api/origamis': 'Crear un nuevo origami (con o sin pasos)',
        'PUT /api/origamis/:id': 'Actualizar un origami existente',
        'DELETE /api/origamis/:id': 'Eliminar un origami y sus pasos asociados',
      },
      pasos: {
        'GET /api/origamis/:id/pasos': 'Listar todos los pasos de un origami',
        'GET /api/pasos/:id': 'Obtener un paso específico por su ID',
        'POST /api/origamis/:id/pasos': 'Agregar un nuevo paso a un origami',
        'POST /api/pasos': 'Crear paso indicando origami_id en el cuerpo',
        'PUT /api/pasos/:id': 'Actualizar título, instrucción o número de un paso',
        'DELETE /api/pasos/:id': 'Eliminar un paso por su ID',
      },
      otros: {
        'GET /api/categorias': 'Listar categorías disponibles con conteo de figuras',
        'GET /api/health': 'Comprobar estado del servidor y base de datos',
        'POST /api/ai/generar': 'Generar nuevo tutorial con generador inteligente de instrucciones',
      },
    },
  });
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const dbTest = await get('SELECT 1 as ok');
    res.json({
      status: 'online',
      db: dbTest?.ok === 1 || dbTest?.ok === '1' ? 'connected' : 'error',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// Categorías
app.get('/api/categorias', async (req, res) => {
  try {
    const categorias = await all(
      `SELECT categoria, COUNT(id) AS total
       FROM origamis
       WHERE categoria IS NOT NULL AND categoria != ''
       GROUP BY categoria
       ORDER BY categoria ASC`
    );
    res.json(categorias);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener categorías', detalle: err.message });
  }
});

// =========================================================================
// CRUD 1: ORIGAMIS
// =========================================================================

// 1.1 READ ALL (Listar con filtros)
app.get('/api/origamis', async (req, res) => {
  try {
    const { q, categoria, dificultad } = req.query;
    let sql = `
      SELECT o.id, o.nombre, o.categoria, o.dificultad, o.descripcion, o.materiales, o.generado_ia,
             (CASE WHEN o.plegado IS NOT NULL THEN 1 ELSE 0 END) AS tiene_3d,
             COUNT(p.id) AS total_pasos
      FROM origamis o
      LEFT JOIN pasos p ON p.origami_id = o.id
      WHERE 1=1
    `;
    const params = [];

    if (q) {
      sql += ` AND (LOWER(o.nombre) LIKE ? OR LOWER(o.descripcion) LIKE ? OR LOWER(o.categoria) LIKE ?)`;
      const search = `%${q.toLowerCase()}%`;
      params.push(search, search, search);
    }

    if (categoria && categoria !== 'Todas') {
      sql += ` AND LOWER(o.categoria) = LOWER(?)`;
      params.push(categoria);
    }

    if (dificultad && dificultad !== 'Todas') {
      sql += ` AND LOWER(o.dificultad) = LOWER(?)`;
      params.push(dificultad);
    }

    sql += ` GROUP BY o.id, o.nombre, o.categoria, o.dificultad, o.descripcion, o.materiales, o.generado_ia, o.plegado ORDER BY o.nombre ASC`;

    const rows = await all(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar origamis', detalle: err.message });
  }
});

// 1.2 READ ONE (Detalle por ID con sus pasos)
app.get('/api/origamis/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    const o = await get('SELECT * FROM origamis WHERE id = ?', [id]);
    if (!o) return res.status(404).json({ error: 'Origami no encontrado' });

    o.pasos = await all(
      'SELECT id, numero, titulo, instruccion FROM pasos WHERE origami_id = ? ORDER BY numero ASC, id ASC',
      [o.id]
    );

    res.json(o);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener origami', detalle: err.message });
  }
});

// 1.3 CREATE (Crear nuevo origami)
app.post('/api/origamis', async (req, res) => {
  try {
    const { nombre, categoria, dificultad, descripcion, materiales, plegado, pasos } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    // Verificar si ya existe un origami con ese nombre
    const existente = await get('SELECT id FROM origamis WHERE LOWER(nombre) = LOWER(?)', [nombre.trim()]);
    if (existente) {
      return res.status(409).json({ error: 'Ya existe un origami con ese nombre' });
    }

    const nuevoId = await saveOrigami({
      nombre: nombre.trim(),
      categoria: categoria ? categoria.trim() : 'Objetos',
      dificultad: dificultad || 'Fácil',
      descripcion: descripcion || '',
      materiales: materiales || '1 hoja cuadrada',
      generado_ia: false,
      plegado: plegado || null,
      pasos: Array.isArray(pasos) ? pasos : [],
    });

    const creado = await get('SELECT * FROM origamis WHERE id = ?', [nuevoId]);
    creado.pasos = await all('SELECT * FROM pasos WHERE origami_id = ? ORDER BY numero ASC', [nuevoId]);

    res.status(201).json({
      mensaje: 'Origami creado con éxito',
      origami: creado,
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear origami', detalle: err.message });
  }
});

// 1.4 UPDATE (Actualizar origami existente)
app.put('/api/origamis/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    const origamiActual = await get('SELECT * FROM origamis WHERE id = ?', [id]);
    if (!origamiActual) return res.status(404).json({ error: 'Origami no encontrado' });

    const { nombre, categoria, dificultad, descripcion, materiales, plegado } = req.body;

    // Si se envía un nombre nuevo, validar que no choque con otro registro
    if (nombre && nombre.trim().toLowerCase() !== origamiActual.nombre.toLowerCase()) {
      const otro = await get('SELECT id FROM origamis WHERE LOWER(nombre) = LOWER(?) AND id != ?', [nombre.trim(), id]);
      if (otro) return res.status(409).json({ error: 'Ya existe otro origami con ese nombre' });
    }

    const nuevoNombre = nombre !== undefined ? nombre.trim() : origamiActual.nombre;
    const nuevaCategoria = categoria !== undefined ? categoria.trim() : origamiActual.categoria;
    const nuevaDificultad = dificultad !== undefined ? dificultad.trim() : origamiActual.dificultad;
    const nuevaDescripcion = descripcion !== undefined ? descripcion : origamiActual.descripcion;
    const nuevosMateriales = materiales !== undefined ? materiales : origamiActual.materiales;
    
    let nuevoPlegado = origamiActual.plegado;
    if (plegado !== undefined) {
      nuevoPlegado = typeof plegado === 'object' && plegado !== null ? JSON.stringify(plegado) : plegado;
    }

    await run(
      `UPDATE origamis
       SET nombre = ?, categoria = ?, dificultad = ?, descripcion = ?, materiales = ?, plegado = ?
       WHERE id = ?`,
      [nuevoNombre, nuevaCategoria, nuevaDificultad, nuevaDescripcion, nuevosMateriales, nuevoPlegado, id]
    );

    const actualizado = await get('SELECT * FROM origamis WHERE id = ?', [id]);
    actualizado.pasos = await all('SELECT * FROM pasos WHERE origami_id = ? ORDER BY numero ASC', [id]);

    res.json({
      mensaje: 'Origami actualizado exitosamente',
      origami: actualizado,
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar origami', detalle: err.message });
  }
});

// 1.5 DELETE (Eliminar origami)
app.delete('/api/origamis/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    const origami = await get('SELECT id, nombre FROM origamis WHERE id = ?', [id]);
    if (!origami) return res.status(404).json({ error: 'Origami no encontrado' });

    // Eliminar pasos y luego el origami
    await run('DELETE FROM pasos WHERE origami_id = ?', [id]);
    await run('DELETE FROM origamis WHERE id = ?', [id]);

    res.json({
      mensaje: `Origami "${origami.nombre}" y todos sus pasos eliminados con éxito`,
      id,
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar origami', detalle: err.message });
  }
});

// =========================================================================
// CRUD 2: PASOS (STEPS)
// =========================================================================

// 2.1 READ ALL PASOS DE UN ORIGAMI
app.get('/api/origamis/:id/pasos', async (req, res) => {
  try {
    const origamiId = parseInt(req.params.id);
    if (isNaN(origamiId)) return res.status(400).json({ error: 'ID de origami inválido' });

    const origami = await get('SELECT id, nombre FROM origamis WHERE id = ?', [origamiId]);
    if (!origami) return res.status(404).json({ error: 'Origami no encontrado' });

    const pasos = await all(
      'SELECT id, origami_id, numero, titulo, instruccion FROM pasos WHERE origami_id = ? ORDER BY numero ASC, id ASC',
      [origamiId]
    );

    res.json({
      origami: origami.nombre,
      total: pasos.length,
      pasos,
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener los pasos', detalle: err.message });
  }
});

// 2.2 READ ONE PASO POR ID
app.get('/api/pasos/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    const paso = await get(
      `SELECT p.*, o.nombre AS origami_nombre
       FROM pasos p
       JOIN origamis o ON o.id = p.origami_id
       WHERE p.id = ?`,
      [id]
    );

    if (!paso) return res.status(404).json({ error: 'Paso no encontrado' });

    res.json(paso);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener el paso', detalle: err.message });
  }
});

// 2.3 CREATE PASO (Vía /api/origamis/:id/pasos o /api/pasos)
const crearPasoHandler = async (req, res) => {
  try {
    const origamiId = parseInt(req.params.id || req.body.origami_id);
    const { titulo, instruccion, numero } = req.body;

    if (isNaN(origamiId)) return res.status(400).json({ error: 'ID de origami es obligatorio' });
    if (!instruccion || !instruccion.trim()) {
      return res.status(400).json({ error: 'La instrucción del paso es obligatoria' });
    }

    const origami = await get('SELECT id, nombre FROM origamis WHERE id = ?', [origamiId]);
    if (!origami) return res.status(404).json({ error: 'El origami referenciado no existe' });

    // Si no se especifica número de paso, asignar automáticamente el siguiente
    let numPaso = parseInt(numero);
    if (isNaN(numPaso) || numPaso <= 0) {
      const maxPaso = await get('SELECT COALESCE(MAX(numero), 0) AS max FROM pasos WHERE origami_id = ?', [origamiId]);
      numPaso = (maxPaso?.max || 0) + 1;
    }

    const tituloPaso = titulo && titulo.trim() ? titulo.trim() : `Paso ${numPaso}`;

    const { id: nuevoPasoId } = await run(
      `INSERT INTO pasos (origami_id, numero, titulo, instruccion) VALUES (?, ?, ?, ?)`,
      [origamiId, numPaso, tituloPaso, instruccion.trim()]
    );

    const pasoCreado = await get('SELECT * FROM pasos WHERE id = ?', [nuevoPasoId]);

    res.status(201).json({
      mensaje: 'Paso agregado exitosamente',
      paso: pasoCreado,
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear el paso', detalle: err.message });
  }
};

app.post('/api/origamis/:id/pasos', crearPasoHandler);
app.post('/api/pasos', crearPasoHandler);

// 2.4 UPDATE PASO
app.put('/api/pasos/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID de paso inválido' });

    const pasoActual = await get('SELECT * FROM pasos WHERE id = ?', [id]);
    if (!pasoActual) return res.status(404).json({ error: 'Paso no encontrado' });

    const { titulo, instruccion, numero } = req.body;

    const nuevoTitulo = titulo !== undefined ? titulo.trim() : pasoActual.titulo;
    const nuevaInstruccion = instruccion !== undefined ? instruccion.trim() : pasoActual.instruccion;
    const nuevoNumero = numero !== undefined ? parseInt(numero) : pasoActual.numero;

    await run(
      `UPDATE pasos SET titulo = ?, instruccion = ?, numero = ? WHERE id = ?`,
      [nuevoTitulo, nuevaInstruccion, nuevoNumero, id]
    );

    const pasoActualizado = await get('SELECT * FROM pasos WHERE id = ?', [id]);

    res.json({
      mensaje: 'Paso actualizado con éxito',
      paso: pasoActualizado,
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar el paso', detalle: err.message });
  }
});

// 2.5 DELETE PASO
app.delete('/api/pasos/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID de paso inválido' });

    const paso = await get('SELECT * FROM pasos WHERE id = ?', [id]);
    if (!paso) return res.status(404).json({ error: 'Paso no encontrado' });

    await run('DELETE FROM pasos WHERE id = ?', [id]);

    res.json({
      mensaje: `Paso ${paso.numero} ("${paso.titulo}") eliminado exitosamente`,
      id,
      origami_id: paso.origami_id,
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar el paso', detalle: err.message });
  }
});

// =========================================================================
// GENERADOR DE INSTRUCCIONES DE ORIGAMI
// =========================================================================
app.post('/api/ai/generar', async (req, res) => {
  const nombre = (req.body.nombre || '').trim();
  if (!nombre) return res.status(400).json({ error: 'Falta el nombre' });

  try {
    const exists = await get('SELECT id FROM origamis WHERE LOWER(nombre) = LOWER(?)', [nombre]);
    if (exists) {
      return res.json({ id: exists.id });
    }

    // Clasificación automática de categoría según el término
    const n = nombre.toLowerCase();
    let categoria = 'Objetos';
    if (/perro|gato|pajaro|pájaro|pez|conejo|oso|elefante|rana|zorro|lobo|leon|león|tigre|dinosaurio|mariposa|aguila|águila|cisne|pato|grulla|dragon|dragón|caballo|jirafa/.test(n)) {
      categoria = 'Animales';
    } else if (/flor|rosa|tulipan|tulipán|estrella|loto|adorno|corazon|corazón|arbol|árbol/.test(n)) {
      categoria = 'Decoración';
    } else if (/casa|edificio|templo|castillo|puente|torre|pagoda/.test(n)) {
      categoria = 'Arquitectura';
    } else if (/avion|avión|barco|cohete|tren|carro|auto|camion|camión|trompo/.test(n)) {
      categoria = 'Transporte';
    }

    const o = {
      nombre: nombre.charAt(0).toUpperCase() + nombre.slice(1),
      categoria,
      dificultad: 'Medio',
      descripcion: `Tutorial detallado para construir una figura de ${nombre.toLowerCase()} en origami tradicional.`,
      materiales: '1 hoja cuadrada de papel kami o papel artesanal (15x15 cm)',
      generado_ia: 1,
      pasos: [
        {
          titulo: 'Posicionar y alinear el papel',
          instruccion: `Coloca una hoja cuadrada limpia sobre la mesa de trabajo con la cara de color hacia abajo para el modelo de ${nombre.toLowerCase()}.`,
        },
        {
          titulo: 'Pliegues guía y diagonales de referencia',
          instruccion: 'Dobla el papel por ambas diagonales de esquina a esquina marcando un pliegue de valle nítido, y luego desdobla para marcar el centro exacto.',
        },
        {
          titulo: 'Estructuración de la base geométrica',
          instruccion: 'Dobla los bordes laterales hacia la línea central vertical de referencia formando la base estructural inicial.',
        },
        {
          titulo: 'Plegado de los ángulos principales',
          instruccion: 'Pliega los extremos superior e inferior en ángulo diagonal para definir las proporciones principales de la figura.',
        },
        {
          titulo: 'Definición de contornos y extremidades',
          instruccion: 'Realiza un pliegue invertido hacia adentro (inside reverse fold) para perfilar los detalles y darle relieve.',
        },
        {
          titulo: 'Modelado tridimensional final',
          instruccion: `Abre suavemente los laterales para dar volumen 3D y estabilidad a tu figura de ${nombre.toLowerCase()}. ¡Origami terminado!`,
        },
      ],
    };

    const id = await saveOrigami(o);
    res.json({ id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo generar el origami' });
  }
});

// Inicializar base de datos y arrancar servidor
await initDb();
app.listen(PORT, '0.0.0.0', () => {
  console.log('====================================================');
  console.log(` API ORIGAMI LISTA (Node.js + Express)`);
  console.log(` Servidor: http://localhost:${PORT}`);
  console.log(` Documentación API: http://localhost:${PORT}/api`);
  console.log('====================================================');
});
