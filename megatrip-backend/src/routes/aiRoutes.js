const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const router = express.Router();

router.use(rateLimit({
  windowMs: 60 * 1000, limit: 15,
  standardHeaders: 'draft-7', legacyHeaders: false,
  message: { message: 'Bạn gửi yêu cầu quá nhanh. Vui lòng thử lại sau.' },
}));

router.post('/chat', async (req, res) => {
  try {
    const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
    if (!prompt) return res.status(400).json({ message: 'Vui lòng nhập nội dung cần hỏi.' });
    if (prompt.length > 12000) return res.status(400).json({ message: 'Nội dung quá dài.' });

    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    if (!apiKey) return res.status(500).json({ message: 'Máy chủ chưa cấu hình GEMINI_API_KEY.' });

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      { contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1200 } },
      { headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }, timeout: 30000 }
    );

    const text = (response.data?.candidates?.[0]?.content?.parts || [])
      .map(part => part.text || '').join('').trim();
    if (!text) return res.status(502).json({ message: 'Gemini chưa trả về nội dung.' });
    return res.json({ text });
  } catch (error) {
    const status = error.response?.status;
    console.error('Gemini API error:', status || error.message, error.response?.data?.error?.message || '');
    if (status === 429) return res.status(429).json({ message: 'Gemini đang giới hạn lượt gọi. Vui lòng thử lại sau.' });
    return res.status(502).json({ message: 'Không thể kết nối dịch vụ AI. Hãy kiểm tra API key và cấu hình.' });
  }
});
module.exports = router;
