const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/api/content/1',
  method: 'OPTIONS',
  headers: {
    'Origin': 'http://localhost:3000',
    'Access-Control-Request-Method': 'GET',
    'Access-Control-Request-Headers': 'payment-signature'
  }
}, res => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
});
req.end();
