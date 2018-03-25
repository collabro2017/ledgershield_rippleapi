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

    this.source_address = "ra6Pi7jHQiXtNCQV5c7c8CN4Grt4h6dmDL";
    this.source_secret = "shKnhcxzhwPaGgL6NzA2ifnKk2NGw";
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
    console.log(`Payment Object ${JSON.stringify(payment)}`)  
    return await this.api.preparePayment(this.source_address, payment);
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
    const amnt = amount.toString()
    const obj = {
      source: {
        address: this.source_address,
        maxAmount: {
          value: amnt,
          currency: "XRP"
        }
      },
      destination: {
        address: destination,
        amount: {
          value: amnt,
          currency: "XRP"
        }
      }
    };

    return obj;
  }
}

module.exports = XRPAPI;
