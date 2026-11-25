const BASE_URL = 'http://localhost:3001/api';

async function testCRUD() {
  console.log('========================================================');
  console.log(' INICIANDO PRUEBAS DE LOS 2 CRUDs (ORIGAMIS Y PASOS)');
  console.log('========================================================\n');

  try {
    // 1. Probar Documentación de API
    console.log('1. Probando GET /api ...');
    const docRes = await fetch(`${BASE_URL}`);
    const docData = await docRes.json();
    console.log('   ✓ Documentación cargada:', docData.nombre, `(${Object.keys(docData.endpoints.origamis).length} endpoints origamis, ${Object.keys(docData.endpoints.pasos).length} endpoints pasos)`);

    // 2. Probar Listar Origamis
    console.log('\n2. Probando GET /api/origamis ...');
    const listRes = await fetch(`${BASE_URL}/origamis`);
    const origamis = await listRes.json();
    console.log(`   ✓ Origamis encontrados: ${origamis.length}`);

    // 3. CRUD 1: Crear Origami (POST)
    console.log('\n3. Probando CREATE Origami: POST /api/origamis ...');
    const createOrigamiRes = await fetch(`${BASE_URL}/origamis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Cisne de Prueba API',
        categoria: 'Animales',
        dificultad: 'Fácil',
        descripcion: 'Elegante figura de cisne creada mediante la API.',
        materiales: '1 hoja cuadrada 15x15 cm',
        pasos: [
          { numero: 1, titulo: 'Diagonal base', instruccion: 'Dobla la hoja por la diagonal principal y desdobla.' },
          { numero: 2, titulo: 'Alas al centro', instruccion: 'Dobla los lados superior e inferior hacia la línea guía.' },
        ],
      }),
    });
    const createdData = await createOrigamiRes.json();
    if (!createOrigamiRes.ok) throw new Error(createdData.error);
    const origamiId = createdData.origami.id;
    console.log(`   ✓ Origami creado con ID: ${origamiId} ("${createdData.origami.nombre}") con ${createdData.origami.pasos.length} pasos iniciales.`);

    // 4. CRUD 1: Leer Origami por ID (GET)
    console.log(`\n4. Probando READ Origami: GET /api/origamis/${origamiId} ...`);
    const getRes = await fetch(`${BASE_URL}/origamis/${origamiId}`);
    const origamiDetalle = await getRes.json();
    console.log(`   ✓ Origami obtenido: ${origamiDetalle.nombre} (Dificultad: ${origamiDetalle.dificultad}, Pasos: ${origamiDetalle.pasos.length})`);

    // 5. CRUD 1: Actualizar Origami (PUT)
    console.log(`\n5. Probando UPDATE Origami: PUT /api/origamis/${origamiId} ...`);
    const updateRes = await fetch(`${BASE_URL}/origamis/${origamiId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dificultad: 'Intermedio',
        descripcion: 'Descripción actualizada exitosamente mediante PUT.',
      }),
    });
    const updateData = await updateRes.json();
    console.log(`   ✓ Origami actualizado: Nueva dificultad = "${updateData.origami.dificultad}"`);

    // 6. CRUD 2: Crear Paso (POST)
    console.log(`\n6. Probando CREATE Paso: POST /api/origamis/${origamiId}/pasos ...`);
    const createPasoRes = await fetch(`${BASE_URL}/origamis/${origamiId}/pasos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: 'Formar el pico del cisne',
        instruccion: 'Haz un pequeño pliegue invertido en la punta del cuello para formar el pico.',
      }),
    });
    const nuevoPasoData = await createPasoRes.json();
    const pasoId = nuevoPasoData.paso.id;
    console.log(`   ✓ Paso creado con ID: ${pasoId} (Paso #${nuevoPasoData.paso.numero}: "${nuevoPasoData.paso.titulo}")`);

    // 7. CRUD 2: Listar Pasos del Origami (GET)
    console.log(`\n7. Probando READ Pasos: GET /api/origamis/${origamiId}/pasos ...`);
    const pasosRes = await fetch(`${BASE_URL}/origamis/${origamiId}/pasos`);
    const pasosData = await pasosRes.json();
    console.log(`   ✓ Pasos totales del origami: ${pasosData.total}`);

    // 8. CRUD 2: Leer Paso Individual (GET)
    console.log(`\n8. Probando READ Paso Individual: GET /api/pasos/${pasoId} ...`);
    const pasoIndRes = await fetch(`${BASE_URL}/pasos/${pasoId}`);
    const pasoIndData = await pasoIndRes.json();
    console.log(`   ✓ Detalle del paso: "${pasoIndData.titulo}" -> "${pasoIndData.instruccion}"`);

    // 9. CRUD 2: Actualizar Paso (PUT)
    console.log(`\n9. Probando UPDATE Paso: PUT /api/pasos/${pasoId} ...`);
    const updatePasoRes = await fetch(`${BASE_URL}/pasos/${pasoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: 'Formar el pico y detalles de la cabeza',
        instruccion: 'Instrucción corregida y actualizada.',
      }),
    });
    const updatePasoData = await updatePasoRes.json();
    console.log(`   ✓ Paso actualizado: "${updatePasoData.paso.titulo}"`);

    // 10. CRUD 2: Eliminar Paso (DELETE)
    console.log(`\n10. Probando DELETE Paso: DELETE /api/pasos/${pasoId} ...`);
    const delPasoRes = await fetch(`${BASE_URL}/pasos/${pasoId}`, { method: 'DELETE' });
    const delPasoData = await delPasoRes.json();
    console.log(`   ✓ Paso eliminado: ${delPasoData.mensaje}`);

    // 11. CRUD 1: Eliminar Origami (DELETE)
    console.log(`\n11. Probando DELETE Origami: DELETE /api/origamis/${origamiId} ...`);
    const delOrigamiRes = await fetch(`${BASE_URL}/origamis/${origamiId}`, { method: 'DELETE' });
    const delOrigamiData = await delOrigamiRes.json();
    console.log(`   ✓ Origami eliminado: ${delOrigamiData.mensaje}`);

    console.log('\n========================================================');
    console.log(' ¡TODAS LAS PRUEBAS DE LOS 2 CRUDs PASARON CON ÉXITO! ');
    console.log('========================================================');
  } catch (error) {
    if (error.cause?.code === 'ECONNREFUSED' || error.message?.includes('fetch failed') || error.message?.includes('ECONNREFUSED')) {
      console.error('\n❌ ERROR: El servidor backend no está encendido en http://localhost:3001.');
      console.error('👉 Por favor abre otra terminal, ejecuta "npm start" dentro de la carpeta backend y vuelve a correr este comando.\n');
    } else {
      console.error('\n❌ ERROR EN LA PRUEBA:', error.message);
    }
  }
}

testCRUD();
