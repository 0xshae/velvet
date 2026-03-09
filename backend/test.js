const express = require('express');
const { paymentMiddleware, x402ResourceServer } = require('@x402/express');
const { ExactEvmScheme } = require('@x402/evm/exact/server');
const { HTTPFacilitatorClient } = require('@x402/core/server');

const app = express();
const facilitatorClient = new HTTPFacilitatorClient({ url: "https://facilitator.x402.org" });
const resourceServer = new x402ResourceServer(facilitatorClient)
  .register("eip155:84532", new ExactEvmScheme());

// Simple route match
app.use(
  paymentMiddleware(
    {
      "GET /test": {
        accepts: { scheme: "exact", price: "1.00 USDC", network: "eip155:84532", payTo: '0x0000000000000000000000000000dead' },
        description: "Test premium text access",
      },
    },
    resourceServer, undefined, undefined, false
  )
);

app.get('/test', (req, res) => res.send('success'));

app.listen(3001, () => console.log('listening'));
