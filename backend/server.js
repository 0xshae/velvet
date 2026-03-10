const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
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

// Create content vault
const contentVault = new Map();
// Seed with ID 1 for backwards compatibility with existing frontend implementation
contentVault.set("1", {
  text: `<img src="/images/penguin.png" alt="Emperor Penguin" class="w-full h-auto rounded-3xl my-6 border border-white/10" /><p class="mb-4 text-gray-300">The breeding cycle begins in the dark, freezing months of March and April when the sea ice is thick enough to support their massive colonies. After laying a single egg, the female transfers it carefully to the male's brood pouch, where he will incubate it for 65 excruciating days without eating.</p><p class="mb-4 text-gray-300">To survive the relentless katabatic winds, the males form massive, constantly shifting huddles. The temperature inside the center of these huddles can reach up to 37 °C, a stark contrast to the freezing ambient air. The constant rotation ensures that no single bird remains on the frigid exterior for too long.</p><p class="text-gray-300">Once the chicks hatch, the females return with bellies full of fish to feed the hungry newborns. The survival of the colony hinges entirely on this delicate, cooperative dance of endurance.</p>`,
  price: "1.00"
});

app.use(
  paymentMiddleware(
    {
      "GET /api/content/*": {
        accepts: {
          scheme: "exact",
          price: (context) => {
            const id = context.path.split('/').pop();
            const content = contentVault.get(id);
            return content ? `${content.price} USDC` : "1.00 USDC";
          },
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

app.post('/api/content', (req, res) => {
  const { text, price } = req.body;
  if (!text || !price) {
    return res.status(400).json({ error: "Missing text or price" });
  }
  
  const contentId = crypto.randomUUID();
  contentVault.set(contentId, { text, price });
  
  res.json({ contentId });
});

app.get('/api/content/:contentId', (req, res) => {
  const contentId = req.params.contentId;
  const content = contentVault.get(contentId);
  
  if (!content) {
    return res.status(404).json({ error: "Content not found" });
  }
  
  res.json({
    id: contentId,
    title: `Premium Insight #${contentId}`,
    text: content.text
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Velvet Express Backend listening on port ${PORT}`);
  });
}

module.exports = app;
