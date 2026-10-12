// apps/backend/src/server.ts

// Sentry must be initialized before any other imports
import { initSentry } from './config/sentry';
initSentry();

import app from './app';
import { env, connectDatabase, disconnectDatabase, ensureStorageBuckets } from './config';

// =============================================
// START SERVER
// =============================================

async function bootstrap() {
  try {
    // Connect to database
    await connectDatabase();

    // Provision required Supabase Storage buckets on fresh projects.
    await ensureStorageBuckets();

    // Start HTTP server
    const server = app.listen(env.PORT, () => {
      console.log('');
      console.log('✨ ============================================ ✨');
      console.log('   🔮 THERAPIST PLATFORM API SERVER');
      console.log('✨ ============================================ ✨');
      console.log('');
      console.log(`   🌍 Environment: ${env.NODE_ENV}`);
      console.log(`   🚀 Server running on: http://localhost:${env.PORT}`);
      console.log(`   📡 API endpoint: http://localhost:${env.PORT}${env.API_PREFIX}`);
      console.log(`   💚 Health check: http://localhost:${env.PORT}/health`);
      console.log('');
      console.log('✨ ============================================ ✨');
      console.log('');
    });

    // =============================================
    // GRACEFUL SHUTDOWN
    // =============================================

    const gracefulShutdown = async (signal: string) => {
      console.log(`\n📤 ${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        console.log('🔌 HTTP server closed');

        try {
          await disconnectDatabase();
          console.log('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:');
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        console.error('⚠️ Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:');
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('UNHANDLED_REJECTION');
    });

  } catch (error) {
    console.error('❌ Failed to start server:');
    process.exit(1);
  }
}

// Start the server
bootstrap();
