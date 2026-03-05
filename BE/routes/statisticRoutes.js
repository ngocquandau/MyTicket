import express from 'express';
import {
    getOverviewStatistic,
    wakeupStatistic,
    getOrganizerStatistic
} from '../controllers/statisticController.js';

import { verifyCronService } from '../middleware/verify-cron.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get   ('/overview', getOverviewStatistic);
router.post  ('/', verifyCronService, wakeupStatistic);

router.get('/organizer', verifyToken, getOrganizerStatistic);

export default router;