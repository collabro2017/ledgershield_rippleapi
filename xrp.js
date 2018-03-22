"use strict";
const RippleAPI = require("ripple-lib").RippleAPI;
// Mainnet Websocket
// wss://s1.ripple.com

// Testnet JSON-RPC
// https://s.altnet.rippletest.net:51234
// wss://s.altnet.rippletest.net:51233

class XRPAPI {
  constructor() {
    this.api = new RippleAPI({
      server: "wss://s.altnet.rippletest.net:51233"
    });

    this.source_address = "rU3jrWo57oscQ3eWQFgV4YWExNLdaHNAeH";
    this.source_secret = "ssCczWA3Bcb7oRs5ukYBSWmNqKaFy";
  }

  async __connect() {
    if (!this.api.isConnected()) await this.api.connect();
  }

  generateAddress() {
    return this.api.generateAddress();
  }

  async getAccountInfo(address) {
    await this.__connect();
    return await this.api.getAccountInfo(address);
  }

  async getTxInfo(txhash) {
    await this.__connect();
    return await this.api.getTransaction(txhash);
  }

  async preparePayment(address, amount) {
    await this.__connect();
    const payment = this.buildPaymentObject(address, amount);
    await this.api.preparePayment(XRPAPI.source_address, payment);
  }

  async signTx(tx) {
    await this.__connect();
    return await this.api.sign(tx, this.source_secret);
  }

  async combineTx(txs) {
    await this.__connect();
    return await this.api.combine(txs);
  }

  async submitTx(signed_tx) {
    await this.__connect();
    return await this.api.submit(signed_tx);
  }

  buildPaymentObject(destination, amount) {
    const obj = {
      source: {
        address: XRPAPI.source_address,
        maxAmount: {
          value: amount,
          currency: "XRP"
        }
      },
      destination: {
        address: destination,
        amount: {
          value: amount,
          currency: "XRP"
        }
      }
    };

    return obj;
  }
}

module.exports = XRPAPI;
