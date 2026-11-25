// ========================================================
// CRUD 1: ORIGAMIS (5 FETCH)
// ========================================================
const API_URL = '/api/origamis';

// 1. FETCH GET (Listar todos los origamis con búsqueda opcional)
export const getOrigamis = async (q = '') => {
  const res = await fetch(`${API_URL}?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error('Error al obtener la lista de origamis');
  return res.json();
};

// 2. FETCH GET :id (Obtener detalle de un origami con sus pasos)
export const getOrigamiById = async (id) => {
  const res = await fetch(`${API_URL}/${id}`);
  if (!res.ok) throw new Error('Origami no encontrado');
  return res.json();
};

// 3. FETCH POST (Crear un nuevo origami)
export const createOrigami = async (datosOrigami) => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datosOrigami),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al crear origami');
  return data;
};

// 4. FETCH PUT :id (Actualizar un origami existente)
export const updateOrigami = async (id, datosActualizados) => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datosActualizados),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al actualizar origami');
  return data;
};

// 5. FETCH DELETE :id (Eliminar un origami)
export const deleteOrigami = async (id) => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al eliminar origami');
  return data;
};

// ========================================================
// CRUD 2: PASOS (STEPS)
// ========================================================

// 1. FETCH GET PASOS (Listar todos los pasos de un origami)
export const getPasos = async (origamiId) => {
  const res = await fetch(`${API_URL}/${origamiId}/pasos`);
  if (!res.ok) throw new Error('Error al obtener los pasos');
  return res.json();
};

// 2. FETCH POST PASO (Crear / agregar un paso a un origami)
export const createPaso = async (origamiId, pasoData) => {
  const res = await fetch(`${API_URL}/${origamiId}/pasos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pasoData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al agregar el paso');
  return data;
};

// 3. FETCH PUT PASO :id (Actualizar título o instrucción de un paso)
export const updatePaso = async (pasoId, pasoData) => {
  const res = await fetch(`/api/pasos/${pasoId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pasoData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al actualizar el paso');
  return data;
};

// 4. FETCH DELETE PASO :id (Eliminar un paso individual)
export const deletePaso = async (pasoId) => {
  const res = await fetch(`/api/pasos/${pasoId}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al eliminar el paso');
  return data;
};
