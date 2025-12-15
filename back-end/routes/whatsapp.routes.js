import { Router } from 'express';
import { getStatus, restartService, sendTestMessage } from '../controllers/whatsapp.controller.js';

const router = Router();

router.get('/status', getStatus);
router.post('/restart', restartService);
router.post('/test', sendTestMessage);

export default router;
