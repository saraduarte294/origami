const f = (p, d, m, zmin) => ({ type: 'fold', p, d, m, ...(zmin !== undefined ? { zmin } : {}) });
const flip = { type: 'flip' };

export const origamis = [
  {
    nombre: 'Casa', categoria: 'Objetos', dificultad: 'Fácil', materiales: '1 hoja cuadrada',
    descripcion: 'Casita con puertas y techo, hecha solo con pliegues rectos.',
    plegado: {
      papel: { w: 2, h: 2, colorA: '#f1e6c8', colorB: '#c8452f' },
      ops: [null, f([-0.5, 0], [0, 1], [-0.9, 0]), f([0.5, 0], [0, 1], [0.9, 0]), f([0, -0.5], [1, 0], [0, -1]),
        f([0, 1], [-1, -1], [-0.5, 1]), f([0, 1], [1, -1], [0.5, 1]), null],
    },
    pasos: [
      { titulo: 'Coloca el papel', instruccion: 'Pon la hoja cuadrada frente a ti, como un cuadrado (no como rombo). El lado que quieres ver al final va hacia abajo.' },
      { titulo: 'Puerta izquierda', instruccion: 'Dobla el borde izquierdo hasta la línea central del papel, como si cerraras una puerta. Marca bien el doblez con la uña.' },
      { titulo: 'Puerta derecha', instruccion: 'Haz lo mismo con el borde derecho. Los dos bordes deben quedar justo en el centro, tocándose sin montarse.' },
      { titulo: 'Sube la base', instruccion: 'Dobla el borde de abajo hacia arriba, hasta la mitad de la altura del papel doblado. Así la casa queda más baja y robusta.' },
      { titulo: 'Techo izquierdo', instruccion: 'Dobla la esquina superior izquierda hacia el centro. El doblez parte de la punta superior del centro y la esquina debe tocar la línea central.' },
      { titulo: 'Techo derecho', instruccion: 'Repite con la esquina superior derecha. Las dos puntas se encuentran en el centro y forman el techo triangular.' },
      { titulo: '¡Casa lista!', instruccion: 'Dibuja ventanas con un marcador. Las solapas de color del frente hacen de puertas.' },
    ],
  },
  {
    nombre: 'Soldado (gorro)', categoria: 'Figuras', dificultad: 'Fácil', materiales: '1 hoja rectangular (carta o A4)',
    descripcion: 'El clásico gorro de soldado. Se ve plano y se abre al final.',
    plegado: {
      papel: { w: 2, h: 2.828, colorA: '#d9d2bd', colorB: '#556b3a' },
      ops: [null, f([0, 0], [1, 0], [0, 1]), f([0, 0], [1, 1], [-1, 0]), f([0, 0], [1, -1], [1, 0]),
        f([0, -1], [1, 0], [0, -1.3], 1), flip, f([0, -1], [1, 0], [0, -1.3]), null],
    },
    pasos: [
      { titulo: 'Prepara la hoja', instruccion: 'Coloca una hoja rectangular en vertical (carta o A4). Un periódico abierto también sirve.' },
      { titulo: 'Dobla a la mitad', instruccion: 'Lleva el borde de arriba hasta el de abajo. El doblez queda arriba y los bordes abiertos abajo.' },
      { titulo: 'Esquina izquierda', instruccion: 'Baja la esquina superior izquierda en diagonal, con el pliegue saliendo de la punta central de arriba, hasta que la esquina llegue a la línea central del papel.' },
      { titulo: 'Esquina derecha', instruccion: 'Repite con la esquina derecha. Las dos esquinas deben juntarse en el mismo punto, y arriba queda un triángulo.' },
      { titulo: 'Sube la tira de adelante', instruccion: 'Bajo el triángulo queda una tira con dos capas. Dobla solo la capa de adelante hacia arriba, sobre el triángulo.' },
      { titulo: 'Voltea el papel', instruccion: 'Voltéalo como si pasaras la página de un libro.' },
      { titulo: 'Sube la otra tira', instruccion: 'Dobla la tira que queda hacia arriba, igual que la primera. Los dos lados quedan iguales.' },
      { titulo: 'Abre el gorro', instruccion: 'Mete los dedos por la abertura de abajo y ábrelo. Aquí el visor lo muestra plano, pero en tus manos toma forma de gorro.' },
    ],
  },
  {
    nombre: 'Cometa', categoria: 'Juguetes', dificultad: 'Fácil', materiales: '1 hoja cuadrada',
    descripcion: 'Una cometa clásica con solo dos dobleces.',
    plegado: {
      papel: { pts: [[0, 1.3], [-1.3, 0], [0, -1.3], [1.3, 0]], colorA: '#f2c230', colorB: '#d6402f' },
      ops: [null, f([0, 1.3], [-0.3827, -0.9239], [-1.3, 0]), f([0, 1.3], [0.3827, -0.9239], [1.3, 0]), flip, null],
    },
    pasos: [
      { titulo: 'Coloca el papel', instruccion: 'Pon la hoja cuadrada como un rombo, con una punta hacia ti.' },
      { titulo: 'Borde izquierdo al centro', instruccion: 'Dobla el borde superior izquierdo hasta la línea central vertical. El doblez sale de la punta de arriba.' },
      { titulo: 'Borde derecho al centro', instruccion: 'Repite con el borde superior derecho. Los dos bordes deben quedar uno junto al otro sobre la línea central.' },
      { titulo: 'Voltea', instruccion: 'Dale la vuelta: ya tienes la forma de la cometa.' },
      { titulo: '¡Cometa lista!', instruccion: 'Decórala y pega una cola de papel en la punta de abajo.' },
    ],
  },
  {
    nombre: 'Barco', categoria: 'Transporte', dificultad: 'Medio', materiales: '1 hoja rectangular',
    descripcion: 'El barco clásico, se hace a partir del gorro de soldado. Sin vista 3D: usa pliegues internos.',
    pasos: [
      { titulo: 'Haz el gorro', instruccion: 'Haz primero el gorro de soldado (figura "Soldado") y ábrelo.' },
      { titulo: 'Aplástalo en rombo', instruccion: 'Con el gorro abierto, junta las costuras del centro para que queden en vertical y aplástalo: se forma un rombo de dos capas.' },
      { titulo: 'Sube la capa de adelante', instruccion: 'Dobla la punta inferior de la capa delantera hasta la punta de arriba.' },
      { titulo: 'Repite atrás', instruccion: 'Voltea y haz lo mismo con la otra capa. Queda un triángulo.' },
      { titulo: 'Abre y aplana', instruccion: 'Abre el triángulo por abajo, junta las dos puntas de la base y aplástalo otra vez en rombo.' },
      { titulo: 'Abre el barco', instruccion: 'Sujeta las dos puntas de arriba y jala suavemente hacia los lados. Abre el centro y apóyalo en la mesa.' },
    ],
  },
  {
    nombre: 'Grulla', categoria: 'Animales', dificultad: 'Difícil', materiales: '1 hoja cuadrada. Sin vista 3D: usa pliegues internos.',
    descripcion: 'El origami más famoso, símbolo de paz.',
    pasos: [
      { titulo: 'Marca los dobleces', instruccion: 'Dobla el cuadrado por las dos diagonales y desdobla. Voltea y dóblalo por la mitad en horizontal y en vertical, y desdobla.' },
      { titulo: 'Base cuadrada', instruccion: 'Junta las cuatro esquinas hacia abajo, hundiendo el centro, hasta formar un cuadrado más pequeño. La esquina abierta queda abajo.' },
      { titulo: 'Dobla los bordes al centro', instruccion: 'En la capa de adelante, dobla los dos bordes inferiores hasta la línea central, para formar una cometa. Repite atrás.' },
      { titulo: 'Base de pájaro', instruccion: 'Dobla la punta de arriba hacia abajo y desdobla. Abre la capa de abajo hacia arriba y aplasta formando un rombo largo. Repite atrás.' },
      { titulo: 'Cuello y cola', instruccion: 'Dobla los bordes hacia el centro, en la capa de adelante y luego atrás. Quedan dos puntas largas abajo.' },
      { titulo: 'Pliegues hacia adentro', instruccion: 'Hunde cada punta inferior hacia arriba, doblándola hacia adentro. Una será el cuello y la otra la cola.' },
      { titulo: 'La cabeza', instruccion: 'En la punta del cuello, haz un pequeño pliegue hacia adentro para el pico.' },
      { titulo: 'Abre las alas', instruccion: 'Baja las dos alas y sopla por la abertura de abajo para inflar el cuerpo.' },
    ],
  },
];
