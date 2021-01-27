const HOUR = 3600*1000;
const maxTimeWindow = 24*HOUR;

const thresholds = {
  feedback: [{octets: 0, cost:  40, timeWindow: HOUR}, {octets: 3, cost:  4, timeWindow: HOUR}],
  cloud:    [{octets: 0, cost: 900, timeWindow: 5*HOUR}, {octets: 3, cost: 90, timeWindow: 24*HOUR}]
};

const log = {};

function addCost(bucket, ip, cost) {
  if (ip === 'bypass') return;
  const time = Date.now();
  if (!(bucket in log)) log[bucket] = [];
  log[bucket].push({ip, cost, time});
  while (log[bucket][0] && log[bucket][0].time <= time - maxTimeWindow) {
    log[bucket].shift();
  }
}

function getCost(bucket, ip, octets, timeWindow) {
  if (ip === 'bypass') return 0;
  if (!(bucket in log)) return 0;
  const time = Date.now();
  const ipMatch = ip.split('.').slice(0, octets).join('.');
  let sum = 0;
  log[bucket].forEach(entry => {
    if (entry.time > time - timeWindow && entry.ip.split('.').slice(0, octets).join('.') === ipMatch) {
      sum += entry.cost;
    }
  });
  return sum;
}

function overCost(bucket, ip) {
  for (let i = 0; i < thresholds[bucket].length; i++) {
    let {octets, cost, timeWindow} = thresholds[bucket][i];
    let currentCost = getCost(bucket, ip, octets, timeWindow);
    if (currentCost >= cost) return (octets ? 'heavy usage in your area' : 'heavy usage');
  }
  return false;
}

function replaceSubmit(bucket, ip, templates) {
  const issue = overCost(bucket, ip);
  const submit = issue ? templates.cooldown({message: templates.message({issue})}) : templates.submit();
  return submit;
}

module.exports = {addCost, overCost, replaceSubmit};
