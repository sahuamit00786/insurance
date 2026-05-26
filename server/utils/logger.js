const fs   = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'app.log');

function stamp() {
  return new Date().toISOString();
}

function write(level, args) {
  const line = `[${stamp()}] [${level}] ${args.map(a =>
    typeof a === 'object' ? JSON.stringify(a, null, 0) : String(a)
  ).join(' ')}\n`;
  fs.appendFile(LOG_FILE, line, () => {});
}

function patchConsole() {
  const origLog   = console.log.bind(console);
  const origError = console.error.bind(console);
  const origWarn  = console.warn.bind(console);

  console.log = (...args) => { origLog(...args);   write('INFO',  args); };
  console.error = (...args) => { origError(...args); write('ERROR', args); };
  console.warn  = (...args) => { origWarn(...args);  write('WARN',  args); };
}

module.exports = { patchConsole, LOG_FILE };
