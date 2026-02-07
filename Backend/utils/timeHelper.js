// File: utils/timeHelper.js
import express from 'express';

const router = express.Router();

// Route: GET /api/time
// Fungsi: Memberikan waktu server saat ini (ISO format & Timestamp)
router.get('/', (req, res) => {
  const now = new Date();
  res.json({
    server_time_iso: now.toISOString(),
    server_timestamp: now.getTime(),
    timezone_offset: now.getTimezoneOffset()
  });
});

export default router;