import express from 'express';
import {
    exportTrainingCSV,
    wakeupGithubAction,
    getRecommendedList
} from '../controllers/modelController.js';

import { verifyCronService }    from '../middleware/verify-cron.js';
import { verifyToken }          from '../middleware/auth.js';

const router = express.Router();

router.get('/model-input', 
    verifyCronService,
    exportTrainingCSV
);

router.post('/train-model',
    verifyCronService,
    wakeupGithubAction
);

router.get('/recommended-list',
    verifyToken, // Chỉ người dùng đã đăng nhập mới được truy cập để có userid mà dùng cho model
    getRecommendedList
);
export default router;