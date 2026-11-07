import { createApp } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  try {
    // 1. Establish database connection
    await connectDB();

    // 2. Initialize Express application
    const app = createApp();

    // 3. Start HTTP server
    const server = app.listen(env.PORT, () => {
      logger.info(`=================================================`);
      logger.info(` TaskFlow Backend Server running in [${env.NODE_ENV}]`);
      logger.info(` Listening on http://localhost:${env.PORT}`);
      logger.info(` Health endpoint: http://localhost:${env.PORT}/api/v1/health`);
      logger.info(`=================================================`);
    });

    // Graceful shutdown handling
    const handleShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Initiating graceful shutdown...`);
      server.close(async () => {
        logger.info('HTTP server closed.');
        await disconnectDB();
        logger.info('TaskFlow backend gracefully terminated.');
        process.exit(0);
      });

      // Force shutdown after timeout
      setTimeout(() => {
        logger.error('Forceful shutdown triggered after timeout.');
        process.exit(1);
      }, 10000).unref();
    };

    process.on('SIGINT', () => void handleShutdown('SIGINT'));
    process.on('SIGTERM', () => void handleShutdown('SIGTERM'));

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection at Promise:', reason);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception thrown:', error);
      void handleShutdown('uncaughtException');
    });
  } catch (err) {
    logger.error('Failed to start TaskFlow server:', err);
    process.exit(1);
  }
}

void bootstrap();
