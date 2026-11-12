module.exports = async (req, res) => {
  try {
    // Referencias explícitas para que el bundler de Vercel (@vercel/nft) incluya todos los paquetes
    require('reflect-metadata');
    require('@nestjs/core');
    require('@nestjs/common');
    require('@nestjs/platform-express');
    require('@nestjs/mongoose');
    require('@nestjs/jwt');
    require('mongoose');
    require('bcrypt');
    require('cloudinary');
    require('multer');
    require('sharp');
    require('class-validator');
    require('class-transformer');

    const { createNestServer } = require('../dist/main');
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
        stack: err && err.stack ? err.stack : undefined,
      }),
    );
  }
};
