const errorHandler = {
  formatError: (error, context = {}) => ({
    timestamp: new Date().toISOString(),
    error: {
      message: error.message || 'Unknown error',
      type: error.type || 'unknown',
      code: error.code || 'unknown',
      stack: error.stack,
      data: error.data
    },
    context: {
      ...context,
      environment: process.env.NODE_ENV || 'development',
      requestId: context.requestId || 'unknown'
    }
  }),

  logError: (error, context = {}) => {
    const errorData = errorHandler.formatError(error, context);
    console.error('Error occurred:', {
      timestamp: errorData.timestamp,
      type: errorData.error.type,
      message: errorData.error.message,
      context: errorData.context,
      stack: errorData.error.stack
    });
  },

  createErrorResponse: (error, context = {}) => {
    const errorData = errorHandler.formatError(error, context);
    const isProduction = process.env.NODE_ENV === 'production';

    return {
      statusCode: error.statusCode || 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': isProduction ? 'https://rarecollectables.co.uk' : '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true'
      },
      body: JSON.stringify({
        error: {
          message: errorData.error.message,
          type: errorData.error.type,
          code: errorData.error.code
        },
        ...(isProduction ? {} : { details: errorData.context })
      })
    };
  }
};

module.exports = errorHandler;
