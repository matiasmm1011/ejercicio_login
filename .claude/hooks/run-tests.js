// Hook PostToolUse (Edit|Write): corre los tests tras cambiar codigo.
// Si fallan, sale con codigo 2 y deja la salida en stderr: Claude la recibe y debe arreglarlos.
const { spawnSync } = require('node:child_process');
const path = require('node:path');

let input = '';
process.stdin.on('data', (c) => (input += c));
process.stdin.on('end', () => {
  let file = '';
  try {
    file = JSON.parse(input).tool_input.file_path || '';
  } catch {
    // sin payload valido: corre los tests igualmente
  }
  // Solo cambios de codigo de la app o de los tests
  if (file && !/\.(js|html|css|sql|json)$/i.test(file)) process.exit(0);
  if (file && /[\/](node_modules|\.claude)[\/]/.test(file)) process.exit(0);

  const root = path.resolve(__dirname, '..', '..');
  const r = spawnSync('npm test', { cwd: root, shell: true, encoding: 'utf8' });
  if (r.status === 0) process.exit(0);

  process.stderr.write(
    'Los tests fallaron tras editar ' + (file || 'el proyecto') + '. ' +
    'Analiza la salida, arregla el codigo (o el test si esta desactualizado) y vuelve a correr npm test hasta que pasen.\n\n' +
    (r.stdout || '') + (r.stderr || '')
  );
  process.exit(2);
});
