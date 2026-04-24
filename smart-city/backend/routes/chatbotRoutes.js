const express = require('express');
const { parseChatMessage, parseFaqMessage } = require('../controllers/chatbotController');

const router = express.Router();

router.post('/message', parseChatMessage);
router.post('/faq', parseFaqMessage);

module.exports = router;
