import express from 'express';
import { apiRouter } from './routes/api.ts';

export const app = express();

app.use(express.json());

// API route namespace
app.use('/api', apiRouter);

// Standard 404 handler for API
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});
