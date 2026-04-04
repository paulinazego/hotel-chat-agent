const http = require('http');
const PORT = process.env.PORT;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hola desde Railway');
}).listen(PORT, '0.0.0.0', () => {
  console.log('Servidor corriendo en puerto ' + PORT);
});
