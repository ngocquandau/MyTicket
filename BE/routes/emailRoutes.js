import express from 'express';
import {
    replyAccountConfirmation, 
    sendTicketConfirmation,
    sendInvoice, 
    sendEventUpdateController,
    addScheduledEmail,
    cronWakeup

} from '../controllers/emailController.js';

import { verifyCronService } from '../middleware/verify-cron.js';

const router = express.Router();

router.post   ('/verify-account', replyAccountConfirmation);
router.post   ('/test-ticket-confirmation', sendTicketConfirmation);
router.post   ('/test-send-invoice', sendInvoice);
router.post   ('/reminder', addScheduledEmail);
router.post   ('/reminder-wakeup', verifyCronService, cronWakeup);

router.post('/send-event-update', sendEventUpdateController);

export default router;