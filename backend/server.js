const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { paymentMiddleware, x402ResourceServer } = require('@x402/express');
const { ExactEvmScheme } = require('@x402/evm/exact/server');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  exposedHeaders: ['PAYMENT-REQUIRED', 'PAYMENT-RESPONSE']
}));
app.use(express.json());

const RECEIVER_ADDRESS = process.env.RECEIVER_ADDRESS || '0x000000000000000000000000000000000000dead';

class MockFacilitatorClient {
  url = "mock";
  async getSupported() {
    return {
      kinds: [
        { x402Version: 2, scheme: "exact", network: "eip155:84532" }
      ],
      extensions: [],
      signers: {}
    };
  }
  async verify(payload, reqs) {
    return { isValid: true };
  }
  async settle(payload, reqs) {
    return { success: true };
  }
}

const facilitatorClient = new MockFacilitatorClient();
const resourceServer = new x402ResourceServer(facilitatorClient)
  .register("eip155:84532", new ExactEvmScheme());

app.use(
  paymentMiddleware(
    {
      "GET /api/content/*": {
        accepts: {
          scheme: "exact",
          price: "1.00 USDC",
          network: "eip155:84532",
          payTo: RECEIVER_ADDRESS,
        },
        description: "Premium email text access",
      },
    },
    resourceServer,
    undefined,
    undefined,
    true
  )
);

app.get('/api/content/:contentId', (req, res) => {
  const contentId = req.params.contentId;
  const premiumContent = {
    id: contentId,
    title: `Premium Insight #${contentId}`,
    text: "This is the premium email text unlocked by your 1.00 USDC micro-payment via the x402 protocol. Welcome to the future of monetization!"
  };
  
  res.json(premiumContent);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Velvet Express Backend listening on port ${PORT}`);
});
