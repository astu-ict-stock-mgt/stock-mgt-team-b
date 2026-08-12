import express, { type Request, type Response } from 'express';
import routes from './routes/index.ts';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.ts';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});

// Mount module routes
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Error handling middleware
app.use(errorHandler);

export default app;
