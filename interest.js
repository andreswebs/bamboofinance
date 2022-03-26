/* Formula for simple interest:
A = P * I * N

A: Amount of Interest
P: Principal
I: Daily Interest Rate
N: Number of days elapsed between payments

Calculating on a Seconds basis:

i: 12% yearly
n: number of seconds
p: principal in USD

Get arguments in USD and days

usage: node interest.js <principal USD> <number of days>

*/

let a, p, i, n;
let start = Date.now();

p = Number(process.argv[2]);
n = Number(process.argv[3]) * 24 * 60 * 60; // convert days into seconds
i = (((((0.12 / 12) / 30)) / 24) / 60) / 60; // interest rate in seconds


function getAmount (p, i, n) {
  return p * i * n;
}

a = getAmount(p, i, n);

console.log(`Started at ${Date.now()} seconds since the Unix Epoch`)

console.log(`The interest rate per second is: ${i.toFixed(12)}`);

console.log(`The amount of interest is ${a.toFixed(2)} USD`);
