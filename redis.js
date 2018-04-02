const redis = require('redis');
const asyncRedis = require('async-redis');

class RedisAPI {

  constructor() {
    this.redisClient = redis.createClient({
      host: '192.168.10.11',
      port: 6379,
      db: 15
    });
    this.client =  asyncRedis.decorate(this.redisClient);
    this.redisClient.on('connect', () => {
      console.log("redis is connected!")
    })
    this.redisClient.on('error', (err) => {
      console.log(err)
    })
  }


  async setKey(key, value) {
    return await this.client.set(key, value)
  }

  async getKey(key) {
    return await this.client.get(key)
  }

  async set(tag, balance, hash, timestamp) {
    return await this.client.hmset(`dt:${tag}`, 'balance', balance, 'hash', hash, 'timestamp', timestamp)
  }

  async get(tag) {
    return await this.client.hgetall(`dt:${tag}`)
  }

  async add(tag) {
    return await this.client.sadd('dts', tag)
  }

  async getAll(cb) {
    return await this.client.smembers('dts', cb)
  }

  async setDt(value) {
    return await this.client.set('destinationTag', value)
  }
  async incrementDt(){
    return await this.client.incrby('destinationTag', 1)
  }
  async getDt() {
    return await this.client.get('destinationTag')
  }
}


module.exports = RedisAPI