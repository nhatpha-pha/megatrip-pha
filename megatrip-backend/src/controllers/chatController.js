
const axios = require('axios');

const chatWithOpenAI = async (req, res) => {
  const prompt =
    typeof req.body?.prompt === 'string'
      ? req.body.prompt.trim()
      : '';

  if (!prompt) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng nhập nội dung cần hỏi.'
    });
  }

  if (prompt.length > 20000) {
    return res.status(413).json({
      success: false,
      message: 'Nội dung quá dài. Vui lòng rút gọn câu hỏi.'
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(503).json({
      success: false,
      message: 'Chatbot chưa được cấu hình OPENAI_API_KEY trên máy chủ.'
    });
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/responses',
      {
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        instructions: [
          'Bạn là trợ lý du lịch của MegaTrip.',
          'Trả lời bằng tiếng Việt, thân thiện, rõ ràng và ngắn gọn.',
          'Chỉ sử dụng dữ liệu tour, xe và dịch vụ thực sự được cung cấp.',
          'Không tự bịa giá, lịch khởi hành, chỗ trống hoặc đường dẫn đặt dịch vụ.',
          'Nếu thiếu dữ liệu để xác nhận, hãy nói rõ điều đó.'
        ].join('\n'),
        input: prompt,
        max_output_tokens: 900
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 45000
      }
    );

    const data = response.data;

    const text = (data.output || [])
      .filter((item) => item.type === 'message')
      .flatMap((item) => item.content || [])
      .filter((item) => item.type === 'output_text')
      .map((item) => item.text || '')
      .join('\n')
      .trim();

    if (!text) {
      console.error(
        '[MegaTrip Chat] OpenAI returned no text.',
        { status: data.status }
      );

      return res.status(502).json({
        success: false,
        message: 'AI chưa trả về nội dung. Vui lòng thử lại.'
      });
    }

    return res.json({
      success: true,
      data: { text }
    });
  } catch (error) {
    const status = error.response?.status;
    const providerError = error.response?.data?.error;

    // Không ghi API key hoặc dữ liệu nhạy cảm vào log.
    console.error('[MegaTrip Chat] OpenAI error:', {
      status: status || null,
      code: providerError?.code || null,
      type: providerError?.type || null,
      message: providerError?.message || error.message
    });

    if (status === 401) {
      return res.status(502).json({
        success: false,
        message: 'OpenAI API key không hợp lệ hoặc không được chấp nhận.'
      });
    }

    if (status === 429) {
      return res.status(429).json({
        success: false,
        message:
          'OpenAI API đang giới hạn yêu cầu hoặc tài khoản chưa có hạn mức khả dụng.'
      });
    }

    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        message: 'AI phản hồi quá lâu. Vui lòng thử lại.'
      });
    }

    return res.status(502).json({
      success: false,
      message: 'Không thể kết nối dịch vụ AI lúc này. Vui lòng thử lại sau.'
    });
  }
};

module.exports = { chatWithOpenAI };
