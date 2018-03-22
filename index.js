"use strict";

const hapi = require("hapi");
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
  path: "/wallet/tx/submit",
  handler: async (req, h) => {
    const payload = req.payload;
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
