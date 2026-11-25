import { useEffect, useMemo, useState } from 'react';
import Viewer3D from './Viewer3D.jsx';
import {
  getOrigamis,
  getOrigamiById,
  createOrigami,
  updateOrigami,
  deleteOrigami,
  createPaso,
  updatePaso,
  deletePaso,
} from './api.js';

export default function App() {
  const [lista, setLista] = useState([]);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(null); // Origami con pasos seleccionado
  const [paso, setPaso] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [msg, setMsg] = useState('');
  const [replay, setReplay] = useState(0);

  // Estado para el formulario CRUD 1 (Origamis: Crear y Editar)
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: 'Objetos',
    dificultad: 'Fácil',
    materiales: '1 hoja cuadrada',
    descripcion: '',
  });

  // Estado para el formulario CRUD 2 (Pasos: Agregar y Editar)
  const [mostrarFormPaso, setMostrarFormPaso] = useState(false);
  const [editingPasoId, setEditingPasoId] = useState(null);
  const [formPasoData, setFormPasoData] = useState({
    titulo: '',
    instruccion: '',
  });

  const plegado = useMemo(() => (sel?.plegado ? JSON.parse(sel.plegado) : null), [sel]);

  // =========================================================================
  // CRUD 1 - 1. FETCH GET (Listar origamis)
  // =========================================================================
  const cargarLista = async (texto = '') => {
    try {
      const data = await getOrigamis(texto);
      setLista(data);
    } catch (e) {
      setMsg('Error cargando origamis: ' + e.message);
    }
  };

  useEffect(() => {
    cargarLista(q);
  }, [q]);

  // =========================================================================
  // CRUD 1 - 2. FETCH GET :id (Detalle de un origami)
  // =========================================================================
  const abrir = async (id) => {
    try {
      const data = await getOrigamiById(id);
      setSel(data);
      setPaso(0);
      setMostrarFormPaso(false);
      setEditingPasoId(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setMsg(e.message);
    }
  };

  // =========================================================================
  // CRUD 1 - 3 & 4. FETCH POST (Crear) y PUT (Actualizar) Origami
  // =========================================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setCargando(true);
    try {
      if (editingId) {
        // FETCH PUT :id
        await updateOrigami(editingId, formData);
        setMsg('¡Origami actualizado exitosamente!');
        if (sel && sel.id === editingId) {
          await abrir(editingId);
        }
      } else {
        // FETCH POST
        const res = await createOrigami({
          ...formData,
          pasos: [
            { numero: 1, titulo: 'Preparar el papel', instruccion: 'Coloca la hoja cuadrada sobre la mesa.' },
            { numero: 2, titulo: 'Primer doblez', instruccion: 'Dobla el papel por la mitad.' },
          ],
        });
        setMsg('¡Origami creado exitosamente!');
        if (res.origami?.id) {
          await abrir(res.origami.id);
        }
      }
      setMostrarForm(false);
      setEditingId(null);
      setFormData({ nombre: '', categoria: 'Objetos', dificultad: 'Fácil', materiales: '1 hoja cuadrada', descripcion: '' });
      await cargarLista(q);
    } catch (e) {
      setMsg(e.message);
    } finally {
      setCargando(false);
    }
  };

  const handleEdit = (origami, e) => {
    if (e) e.stopPropagation();
    setEditingId(origami.id);
    setFormData({
      nombre: origami.nombre,
      categoria: origami.categoria || 'Objetos',
      dificultad: origami.dificultad || 'Fácil',
      materiales: origami.materiales || '1 hoja cuadrada',
      descripcion: origami.descripcion || '',
    });
    setMostrarForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // =========================================================================
  // CRUD 1 - 5. FETCH DELETE :id (Eliminar origami)
  // =========================================================================
  const handleDelete = async (id, nombre, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`¿Estás seguro de eliminar el origami "${nombre}"?`)) return;

    try {
      await deleteOrigami(id);
      if (sel && sel.id === id) setSel(null);
      await cargarLista(q);
      setMsg(`Origami "${nombre}" eliminado correctamente.`);
    } catch (e) {
      setMsg(e.message);
    }
  };

  // =========================================================================
  // CRUD 2: GESTIÓN DE PASOS (STEPS)
  // =========================================================================

  // Guardar Paso: POST (Crear) o PUT (Editar)
  const handleSubmitPaso = async (e) => {
    e.preventDefault();
    if (!sel) return;
    setCargando(true);
    try {
      if (editingPasoId) {
        // CRUD 2 - FETCH PUT PASO
        await updatePaso(editingPasoId, formPasoData);
        setMsg('¡Paso actualizado con éxito!');
      } else {
        // CRUD 2 - FETCH POST PASO
        await createPaso(sel.id, formPasoData);
        setMsg('¡Nuevo paso agregado al origami!');
      }
      setMostrarFormPaso(false);
      setEditingPasoId(null);
      setFormPasoData({ titulo: '', instruccion: '' });
      await abrir(sel.id);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setCargando(false);
    }
  };

  // Iniciar edición de un paso
  const handleEditPaso = (p) => {
    setEditingPasoId(p.id);
    setFormPasoData({
      titulo: p.titulo,
      instruccion: p.instruccion,
    });
    setMostrarFormPaso(true);
  };

  // CRUD 2 - FETCH DELETE PASO
  const handleDeletePaso = async (pasoId, numPaso) => {
    if (!window.confirm(`¿Eliminar el Paso ${numPaso}?`)) return;
    try {
      await deletePaso(pasoId);
      setMsg(`Paso ${numPaso} eliminado con éxito.`);
      await abrir(sel.id);
    } catch (err) {
      setMsg(err.message);
    }
  };

  // Generar automáticamente nuevas figuras
  const generarConIA = async () => {
    setCargando(true);
    setMsg('');
    try {
      const r = await fetch('/api/ai/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: q }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      await cargarLista('');
      setQ('');
      await abrir(d.id);
    } catch (e) {
      setMsg(e.message);
    }
    setCargando(false);
  };

  // =========================================================================
  // VISTA DE DETALLE DEL ORIGAMI (CON VISOR 3D Y CRUD 2 DE PASOS)
  // =========================================================================
  if (sel) {
    const p = sel.pasos && sel.pasos[paso] ? sel.pasos[paso] : { numero: 1, titulo: 'Paso 1', instruccion: 'Sigue el modelo.' };
    return (
      <main className="wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <button className="link" onClick={() => setSel(null)}>← Volver al catálogo</button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-small" onClick={(e) => handleEdit(sel, e)}>Editar Origami (PUT)</button>
            <button className="btn-small btn-delete" onClick={(e) => handleDelete(sel.id, sel.nombre, e)}>Eliminar Origami (DEL)</button>
          </div>
        </div>

        {msg && <p className={msg.includes('Error') ? 'error' : 'meta'} style={{ margin: '12px 0' }}>{msg}</p>}

        <h1>{sel.nombre}</h1>
        <p className="meta">{sel.dificultad} · {sel.materiales}{sel.generado_ia ? ' · Generado con IA' : ''}</p>
        <p>{sel.descripcion}</p>

        {plegado ? (
          <>
            <Viewer3D plegado={plegado} paso={paso} replay={replay} />
            <p className="meta">
              Arrastra para girar el papel. <button className="link" onClick={() => setReplay(replay + 1)}>Ver el doblez otra vez</button>
            </p>
          </>
        ) : (
          <p className="aviso">
            Este origami no tiene vista 3D todavía: usa pliegues internos que el visor aún no simula. Los pasos escritos sí están completos.
          </p>
        )}

        {/* SECCIÓN DEL CRUD 2: PASOS */}
        <section className="paso" aria-live="polite">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            <h2>Paso {p.numero} de {sel.pasos.length}: {p.titulo}</h2>
            {p.id && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="btn-small" onClick={() => handleEditPaso(p)} title="Editar este paso (PUT)">
                  Editar Paso
                </button>
                {sel.pasos.length > 1 && (
                  <button className="btn-small btn-delete" onClick={() => handleDeletePaso(p.id, p.numero)} title="Eliminar este paso (DELETE)">
                    Eliminar Paso
                  </button>
                )}
              </div>
            )}
          </div>

          <p className="texto">{p.instruccion}</p>
          <progress value={paso + 1} max={sel.pasos.length} />

          <div className="nav" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button disabled={paso === 0} onClick={() => setPaso(paso - 1)}>Anterior</button>
              <button disabled={paso === sel.pasos.length - 1} onClick={() => setPaso(paso + 1)}>Siguiente</button>
            </div>
            <button
              className="btn-small"
              onClick={() => {
                setEditingPasoId(null);
                setFormPasoData({ titulo: '', instruccion: '' });
                setMostrarFormPaso(!mostrarFormPaso);
              }}
            >
              {mostrarFormPaso ? 'Cerrar' : '+ Agregar Paso (POST)'}
            </button>
          </div>
        </section>

        {/* FORMULARIO CRUD 2: AGREGAR O EDITAR PASO */}
        {mostrarFormPaso && (
          <form onSubmit={handleSubmitPaso} className="form-crud" style={{ marginTop: '16px' }}>
            <h3>{editingPasoId ? 'Editar Paso Actual (PUT)' : 'Agregar Nuevo Paso (POST)'}</h3>
            <div className="form-group">
              <label>Título del paso:</label>
              <input
                type="text"
                required
                placeholder="ej. Doblar las puntas hacia el centro"
                value={formPasoData.titulo}
                onChange={(e) => setFormPasoData({ ...formPasoData, titulo: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Instrucciones detalladas:</label>
              <textarea
                rows={2}
                required
                placeholder="Describe cómo se dobla el papel en este paso..."
                value={formPasoData.instruccion}
                onChange={(e) => setFormPasoData({ ...formPasoData, instruccion: e.target.value })}
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="primario" disabled={cargando}>
                {cargando ? 'Guardando...' : editingPasoId ? 'Guardar Cambios (PUT)' : 'Crear Paso (POST)'}
              </button>
              <button type="button" className="secundario" onClick={() => setMostrarFormPaso(false)}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        <ol className="indice">
          {sel.pasos.map((s, i) => (
            <li key={i}>
              <button className={i === paso ? 'on' : ''} onClick={() => setPaso(i)}>{s.titulo}</button>
            </li>
          ))}
        </ol>
      </main>
    );
  }

  // =========================================================================
  // VISTA PRINCIPAL (CATÁLOGO Y FORMULARIO CRUD 1)
  // =========================================================================
  return (
    <main className="wrap">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1>Papel Plegado</h1>
          <p className="meta">Plataforma interactiva con soporte completo para 2 CRUDs (Origamis y Pasos).</p>
        </div>
        <button
          className="primario"
          onClick={() => {
            setEditingId(null);
            setFormData({ nombre: '', categoria: 'Objetos', dificultad: 'Fácil', materiales: '1 hoja cuadrada', descripcion: '' });
            setMostrarForm(!mostrarForm);
          }}
        >
          {mostrarForm ? 'Cerrar Formulario' : '+ Crear Nuevo Origami (POST)'}
        </button>
      </div>

      {msg && <p className={msg.includes('Error') ? 'error' : 'meta'} style={{ margin: '12px 0' }}>{msg}</p>}

      {/* FORMULARIO CRUD 1: POST (Crear) y PUT (Actualizar) Origami */}
      {mostrarForm && (
        <form onSubmit={handleSubmit} className="form-crud">
          <h2>{editingId ? `Editar Origami #${editingId} (PUT)` : 'Crear Nuevo Origami (POST)'}</h2>

          <div className="form-group">
            <label>Nombre del origami:</label>
            <input
              type="text"
              required
              placeholder="ej. Barco Pirata"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Categoría:</label>
              <select
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              >
                <option value="Objetos">Objetos</option>
                <option value="Figuras">Figuras</option>
                <option value="Juguetes">Juguetes</option>
                <option value="Transporte">Transporte</option>
                <option value="Animales">Animales</option>
              </select>
            </div>

            <div className="form-group">
              <label>Dificultad:</label>
              <select
                value={formData.dificultad}
                onChange={(e) => setFormData({ ...formData, dificultad: e.target.value })}
              >
                <option value="Fácil">Fácil</option>
                <option value="Medio">Medio</option>
                <option value="Difícil">Difícil</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Materiales necesarios:</label>
            <input
              type="text"
              placeholder="ej. 1 hoja cuadrada 15x15 cm"
              value={formData.materiales}
              onChange={(e) => setFormData({ ...formData, materiales: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Descripción:</label>
            <textarea
              rows={2}
              placeholder="Breve resumen de la figura..."
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="primario" disabled={cargando}>
              {cargando ? 'Guardando...' : editingId ? 'Guardar Cambios (PUT)' : 'Crear Origami (POST)'}
            </button>
            <button
              type="button"
              className="secundario"
              onClick={() => {
                setMostrarForm(false);
                setEditingId(null);
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* 1. FETCH GET (Búsqueda en tiempo real) */}
      <input
        className="buscar"
        placeholder="Busca: casa, camisa, soldado, dragón..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {/* GRID DE ORIGAMIS */}
      <div className="grid">
        {lista.map((o) => (
          <div key={o.id} className="card">
            <div className="card-content" onClick={() => abrir(o.id)}>
              <strong>{o.nombre}</strong>
              <span>{o.categoria} · {o.dificultad}</span>
              <p style={{ fontSize: '0.82rem', margin: '4px 0', color: 'var(--ink-soft)' }}>
                {o.descripcion?.slice(0, 70)}...
              </p>
            </div>

            <div className="card-actions">
              <button
                className="btn-small"
                onClick={(e) => handleEdit(o, e)}
                title="Editar este origami (PUT)"
              >
                Editar (PUT)
              </button>
              <button
                className="btn-small btn-delete"
                onClick={(e) => handleDelete(o.id, o.nombre, e)}
                title="Eliminar este origami (DELETE)"
              >
                Eliminar (DEL)
              </button>
            </div>
          </div>
        ))}
      </div>

      {q && lista.length === 0 && (
        <div className="vacio">
          <p>No tenemos «{q}» todavía.</p>
          <button className="primario" onClick={generarConIA} disabled={cargando}>
            {cargando ? 'Generando...' : `Crear instrucciones de «${q}» con IA`}
          </button>
          {msg && <p className="error">{msg}</p>}
        </div>
      )}
    </main>
  );
}
