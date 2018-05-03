"use strict";

const hapi = require("hapi");
const ripple_hashes_1 = require("ripple-hashes");
const XRPAPI = require("./xrp");
const RedisAPI = require("./redis");

const server = hapi.server({
  host: "localhost",
  port: 9002
});

const xrp_api = new XRPAPI();
const redisAPI = new RedisAPI();

const setinfo = async () => {
  const dt = await redisAPI.getDt()
  if(dt === null) {
    redisAPI.setDt(10000);
  }
}
setinfo()


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
  handler: async (req, h) => {
    await redisAPI.incrementDt()
    const dt = await redisAPI.getDt()
    const address = xrp_api.getAddress();
    const r = {
      address: address,
      dt: parseInt(dt)
    }
    return h.response(r).code(201);
  }
});

server.route({
  method: 'GET',
  path: '/wallet/dt/{dt}',
  handler: async (req, h) => {
    const dt = req.params.dt;    
    const res = await redisAPI.get(dt)
    console.log(`Response type ${typeof res}`)
    if(res === 'undefined' || res === undefined || res === null) {
      return h.response({'message':'Nothing'}).code(404)
    }
    return h.response(res).code(200)
  }
})

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
    console.log(payload)

    // await payload.map(async (item, i) => {
    //   const payment = await xrp_api.preparePayment(item.address, item.amount)
    //   console.log(payment);
    //   const tx =  await xrp_api.signTx(payment.txJSON)
    //   console.log(tx)
    //   signed_tx.push(tx.signedTransaction);
    // })
    const outputs = [];
    try {
      const txid = payload.txid
      const outs = payload.outs
      for (let i = 0; i < outs.length; i++) {
        const item = outs[i];
        const tx_hash = await redisAPI.getTxStatus(txid, item.address)

        if (tx_hash === null) {
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
            await redisAPI.getTxStatus(txid, item.address, tx_id)
          } else {
            item["tx_hash"] = "";
          }
          item["comment"] = response.resultMessage;
        } else {
          item["comment"] = "Double spend!"
        }

        console.log(item)
        
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
