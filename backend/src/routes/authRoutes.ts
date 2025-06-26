import express from 'express';

const router = express.Router();

// Authentication routes removed - no longer needed
router.get('/health', (req, res) => {
  res.json({ message: 'Auth routes disabled - authentication removed' });
});

export default router; 