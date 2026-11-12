const { createNestServer } = require('../dist/main');

module.exports = async (req, res) => {
  try {
    const server = await createNestServer();
    return server(req, res);
  } catch (err) {
    console.error('Error iniciando NestJS en Vercel:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: 'Error al iniciar el servidor backend',
        detalle: err && err.message ? err.message : String(err),
      }),
    );
  }
};
