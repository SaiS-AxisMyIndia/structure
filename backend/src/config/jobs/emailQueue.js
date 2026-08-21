// Email queue job (e.g. bull/bullmq backed by Redis)
// Example (bullmq):
// const { Queue } = require('bullmq');
// const emailQueue = new Queue('emailQueue', { connection: { host: '127.0.0.1', port: 6379 } });
//
// const enqueueEmail = async (payload) => emailQueue.add('sendEmail', payload);
//
// module.exports = { emailQueue, enqueueEmail };

const enqueueEmail = async (payload) => {
  // TODO: integrate real queue implementation
  return payload;
};

module.exports = {
  enqueueEmail,
};
