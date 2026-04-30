const { Prisma } = require('@prisma/client');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Prisma Error Handling
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (err.code === 'P2002') {
      statusCode = 400;
      const field = err.meta?.target || 'field';
      message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
    }
    // Foreign key constraint violation
    if (err.code === 'P2003') {
      statusCode = 400;
      message = 'Related record not found.';
    }
    // Record not found
    if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Record not found.';
    }
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('Error Details:', {
      name: err.name,
      code: err.code,
      message: err.message,
      stack: err.stack
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
