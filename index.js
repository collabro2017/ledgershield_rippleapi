"use strict";

const hapi = require("hapi");
const ripple_hashes_1 = require("ripple-hashes");
const XRPAPI = require("./xrp");

const server = hapi.server({
  host: "localhost",
  port: 9002
});

const xrp_api = new XRPAPI();

server.route({
  method: "GET",
  path: "/",
  handler: (req, h) => {
    return "Welcome to XRP api console.";
  }
});

server.route({
  method: "POST",
  path: "/wallet/new",
  handler: (req, h) => {
    const data = xrp_api.generateAddress();
    return h.response(data).code(201);
  }
});

server.route({
  method: "GET",
  path: "/wallet/info/{address}",
  handler: async (req, h) => {
    const address = req.params.address ? req.params.address : null;

    if (address === null)
      return h.response({ error: "Address can't be empty!" }).status(400);

    const data = await xrp_api.getAccountInfo(address);
    return h.response(data).code(200);
  }
});

server.route({
  method: "GET",
  path: "/wallet/tx/{tx}",
  handler: async (req, h) => {
    const tx = req.params.tx ? req.params.tx : null;

    if (tx === null)
      return h.response({ error: "TX Hash can't be empty!" }).status(400);

    const data = await xrp_api.getTxInfo(tx);
    return h.response(data).code(200);
  }
});

server.route({
  method: "POST",
  path: "/wallet/transfer",
  handler: async (req, h) => {
    let payload = req.payload;
    const signed_txs = [];

    if (typeof payload === "string") {
      payload = JSON.parse(payload);
    }
    // console.log(payload)

    // await payload.map(async (item, i) => {
    //   const payment = await xrp_api.preparePayment(item.address, item.amount)
    //   console.log(payment);
    //   const tx =  await xrp_api.signTx(payment.txJSON)
    //   console.log(tx)
    //   signed_tx.push(tx.signedTransaction);
    // })
    const outputs = [];
    try {
      for (let i = 0; i < payload.length; i++) {
        const item = payload[i];
        const payment = await xrp_api.preparePayment(item.address, item.amount);
        // console.log(payment);
        const tx = await xrp_api.signTx(payment.txJSON);

        const response = await xrp_api.submitTx(tx.signedTransaction);
        const tx_id = ripple_hashes_1.computeBinaryTransactionHash(
          tx.signedTransaction
        );
        console.log(`TxID ${tx_id} Response ${JSON.stringify(response)}`);
        if (response.resultCode === "tesSUCCESS") {
          item["tx_hash"] = tx_id;
        } else {
          item["tx_hash"] = "";
        }
        item["comment"] = response.resultMessage;
        outputs.push(item);
      }
    } catch (err) {
      console.log(err);
      return payload;
    }

    return outputs;
  }
});

server.events.on("log", (event, tags) => {
  if (tags.error) {
    console.log(
      `Server error: ${event.error ? event.error.message : "unknown"}`
    );
  }
});

const start = async () => {
  try {
    await server.start();
  } catch (err) {
    console.log(err);
    process.exit(1);
  }

  console.log(`Server running at ${server.info.uri}`);
};

start();
