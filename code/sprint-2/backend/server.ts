import 'dotenv/config';

import app from './app';
import ensureAdmin from './src/bootstrap/ensureAdmin';

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await ensureAdmin();
  } catch (e) {
    console.error('Admin bootstrap failed:', e);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
})();

// Graceful Shutdown
process.on('unhandledRejection', (err: unknown) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err);
  process.exit(1);
});
