import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let memoryServer: { stop: () => Promise<boolean> } | null = null;

export async function connectDB(): Promise<typeof mongoose> {
  const isDev = env.NODE_ENV === 'development';

  // Check if explicit in-memory database is requested
  if (env.USE_IN_MEMORY_DB) {
    try {
      logger.info('USE_IN_MEMORY_DB is enabled. Initializing MongoMemoryServer...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create({
        instance: { launchTimeout: 30000 },
      });
      memoryServer = mongod;
      const uri = mongod.getUri();
      logger.info(`MongoMemoryServer started at ${uri}`);

      const conn = await mongoose.connect(uri);
      logger.info('Connected to In-Memory MongoDB successfully.');
      return conn;
    } catch (err) {
      logger.error('Failed to initialize In-Memory MongoDB:', err);
      throw err;
    }
  }

  // Attempt connection to the configured MONGO_URI
  try {
    logger.info(`Connecting to MongoDB at ${env.MONGO_URI}...`);
    const conn = await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    logger.info(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    logger.error(`Initial MongoDB connection failed to ${env.MONGO_URI}:`, err);

    // In development mode, provide automatic seamless fallback to MongoMemoryServer
    if (isDev) {
      try {
        logger.warn('Falling back to In-Memory MongoDB for local development...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create({
          instance: { launchTimeout: 30000 },
        });
        memoryServer = mongod;
        const uri = mongod.getUri();
        logger.info(`MongoMemoryServer started at ${uri}`);

        const conn = await mongoose.connect(uri);
        logger.info('Fallback connected to In-Memory MongoDB successfully.');
        return conn;
      } catch (fallbackErr) {
        logger.error('Fallback to MongoMemoryServer also failed:', fallbackErr);
        throw fallbackErr;
      }
    }

    throw err;
  }
}

export async function disconnectDB(): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      logger.info('Mongoose disconnected.');
    }
    if (memoryServer) {
      await memoryServer.stop();
      logger.info('MongoMemoryServer stopped.');
      memoryServer = null;
    }
  } catch (err) {
    logger.error('Error during database disconnection:', err);
  }
}

// Connection event listeners
mongoose.connection.on('connected', () => {
  logger.info('Mongoose connection established.');
});

mongoose.connection.on('error', (err) => {
  logger.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('Mongoose disconnected from database.');
});
