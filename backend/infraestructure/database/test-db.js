const pool = require('./db'); // Corregidas las comillas

async function test() {
  try {
    // 1. Quitamos el punto después de await 
    // 2. En MySQL, NOW() funciona, pero el resultado es un arreglo directo (sin .rows)
    const [rows] = await pool.query('SELECT NOW() AS fecha');
    
    // Mostramos la primera fila del arreglo
    console.log('Conexión exitosa a MySQL servidor de nube:', rows[0]);
    
    // Quitamos el punto después de await
    await pool.end(); 
  } catch (error) {
    // Corregido a 'message'
    console.error('Error de conexión:', error.message); 
  }
}

test();