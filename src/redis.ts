import redis from 'redis';

const client = redis.createClient(Number(process.env.REDIS_PORT || 6379), process.env.REDIS_HOST);

client.on('connect', function() {
  console.log('redis connected');
});

export default client;
