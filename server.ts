import path from 'path';
import express from 'express';
import { app } from './server/app.ts';

const PORT = 3000;
const distPath = path.join(process.cwd(), 'dist');

// Static assets
app.use(express.static(distPath));

// SPA Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
