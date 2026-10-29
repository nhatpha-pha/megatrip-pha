const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const router = express.Router();

router.use(rateLimit({
  windowMs: 60 * 1000, limit: 30,
  standardHeaders: 'draft-7', legacyHeaders: false,
  message: { message: 'Bạn tra cứu quá nhanh. Vui lòng thử lại sau.' },
}));

let cachedToken = null;
let tokenExpiresAt = 0;

async function getAmadeusToken() {
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) return cachedToken;
  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
  const baseUrl = (process.env.AMADEUS_BASE_URL || 'https://test.api.amadeus.com').replace(/\/$/, '');
  if (!clientId || !clientSecret) {
    const err = new Error('Máy chủ chưa cấu hình thông tin Amadeus.');
    err.statusCode = 500; throw err;
  }
  const form = new URLSearchParams({
    grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret
  });
  const response = await axios.post(`${baseUrl}/v1/security/oauth2/token`, form.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000
  });
  cachedToken = response.data.access_token;
  tokenExpiresAt = Date.now() + Number(response.data.expires_in || 1800) * 1000;
  return cachedToken;
}

router.get('/search', async (req, res) => {
  try {
    const { originLocationCode, destinationLocationCode, departureDate, returnDate,
      adults = '1', children, infants, travelClass, currencyCode = 'VND', max = '10', nonStop, includedAirlineCodes } = req.query;

    const iata = /^[A-Z]{3}$/;
    if (!iata.test(String(originLocationCode || '').toUpperCase()) ||
        !iata.test(String(destinationLocationCode || '').toUpperCase()))
      return res.status(400).json({ message: 'Mã sân bay phải gồm 3 chữ cái, ví dụ SGN và HAN.' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(departureDate || '')))
      return res.status(400).json({ message: 'Ngày khởi hành phải theo định dạng YYYY-MM-DD.' });
    if (returnDate && !/^\d{4}-\d{2}-\d{2}$/.test(String(returnDate)))
      return res.status(400).json({ message: 'Ngày về phải theo định dạng YYYY-MM-DD.' });

    const adultCount = Number(adults), childCount = children === undefined ? undefined : Number(children);
    const infantCount = infants === undefined ? undefined : Number(infants), maxResults = Number(max);
    if (!Number.isInteger(adultCount) || adultCount < 1 || adultCount > 9 ||
        (childCount !== undefined && (!Number.isInteger(childCount) || childCount < 0 || childCount > 9)) ||
        (infantCount !== undefined && (!Number.isInteger(infantCount) || infantCount < 0 || infantCount > adultCount)) ||
        !Number.isInteger(maxResults) || maxResults < 1 || maxResults > 50)
      return res.status(400).json({ message: 'Số hành khách hoặc số kết quả không hợp lệ.' });

    const params = new URLSearchParams({
      originLocationCode: String(originLocationCode).toUpperCase(),
      destinationLocationCode: String(destinationLocationCode).toUpperCase(),
      departureDate: String(departureDate), adults: String(adultCount),
      currencyCode: String(currencyCode).toUpperCase(), max: String(maxResults)
    });
    if (returnDate) params.set('returnDate', String(returnDate));
    if (children !== undefined) params.set('children', String(childCount));
    if (infants !== undefined) params.set('infants', String(infantCount));
    if (travelClass) {
      const cls = String(travelClass).toUpperCase();
      if (!['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'].includes(cls))
        return res.status(400).json({ message: 'Hạng vé không hợp lệ.' });
      params.set('travelClass', cls);
    }
    if (includedAirlineCodes) {
      const codes = String(includedAirlineCodes).toUpperCase();
      if (!/^[A-Z0-9]{2}(,[A-Z0-9]{2})*$/.test(codes))
        return res.status(400).json({ message: 'Mã hãng bay không hợp lệ.' });
      params.set('includedAirlineCodes', codes);
    }
    if (String(nonStop) === 'true') params.set('nonStop', 'true');

    const baseUrl = (process.env.AMADEUS_BASE_URL || 'https://test.api.amadeus.com').replace(/\/$/, '');
    const token = await getAmadeusToken();
    const response = await axios.get(`${baseUrl}/v2/shopping/flight-offers?${params}`, {
      headers: { Authorization: `Bearer ${token}` }, timeout: 30000
    });
    return res.json({ data: response.data?.data || [],
      dictionaries: response.data?.dictionaries || {}, meta: response.data?.meta || {} });
  } catch (error) {
    const status = error.response?.status;
    console.error('Amadeus API error:', status || error.statusCode || error.message, error.response?.data?.errors || '');
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    if (status === 429) return res.status(429).json({ message: 'Amadeus đang giới hạn lượt tra cứu.' });
    return res.status(502).json({ message: 'Không thể tra cứu chuyến bay. Kiểm tra thông tin API hoặc thử lại.' });
  }
});
module.exports = router;
