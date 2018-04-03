'use strict';
const child_process = require("child_process");
const XRPAPI = require("./xrp");
const RedisAPI = require('./redis')

const redisAPI = new RedisAPI()
const xrp_api = new XRPAPI();

const sync_redis_ledger = async () => {
  try{
    
    let minLedgerVersion = await redisAPI.getKey('minLedgerVersion');
    minLedgerVersion = parseInt(minLedgerVersion)
    if (isNaN(minLedgerVersion) || minLedgerVersion < 1) {
      minLedgerVersion = 6915400
    }

    let maxLedgerVersion = await redisAPI.getKey('maxLedgerVersion')
    maxLedgerVersion = parseInt(maxLedgerVersion)

    while(true){
      const info = await xrp_api.getAccountInfo()
      const maxLV = info.previousAffectingTransactionLedgerVersion;
      if (isNaN(maxLedgerVersion)) {
        maxLedgerVersion = maxLV
      }

      console.log(`${new Date().toISOString()} Min Ledger ${minLedgerVersion}, Max Ledger ${maxLedgerVersion}, Max LV ${maxLV}`)

      if( maxLedgerVersion < maxLV) {
        maxLedgerVersion = maxLV
        const transactions = await xrp_api.getAccountTx(minLedgerVersion, maxLedgerVersion)
        // console.log(JSON.stringify(transactions))
        if (transactions.length > 0) {        
          for (const i in transactions) {
            const tx = transactions[i]
            // console.log(JSON.stringify(tx))
            if (tx.specification.destination.tag !== undefined) {
              const dt = tx.specification.destination.tag;
              const value = tx.outcome.deliveredAmount.value;
              // minLedgerVersion = tx.outcome.ledgerVersion > minLedgerVersion ? tx.outcome.ledgerVersion : minLedgerVersion ;
              const id = tx.id;
              const timestamp  = new Date().valueOf()
              console.log(`Destination Tag ${dt}, Amount ${value}, Ledger Version ${minLedgerVersion}, ID ${id}`)
              redisAPI.set(dt, value, id, timestamp)              
            }
            minLedgerVersion = maxLedgerVersion;            
            redisAPI.setKey('minLedgerVersion', minLedgerVersion)
            redisAPI.setKey('maxLedgerVersion', maxLedgerVersion)
          }   
        }
        child_process.execSync("sleep 20");
      } else {        
        child_process.execSync("sleep 30");
      }
    }
  } catch(err) {
    console.log(err)
  }

}

sync_redis_ledger()