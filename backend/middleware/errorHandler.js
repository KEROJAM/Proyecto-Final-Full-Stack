const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      details: err.message
    });
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      error: 'Registro duplicado',
      details: 'El recurso ya existe'
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token inválido',
      details: 'El token proporcionado no es válido'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expirado',
      details: 'El token ha expirado, por favor inicie sesión nuevamente'
    });
  }

  res.status(500).json({
    error: 'Error interno del servidor',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    details: `No se puede encontrar ${req.method} ${req.originalUrl}`
  });
};

module.exports = { errorHandler, notFoundHandler };