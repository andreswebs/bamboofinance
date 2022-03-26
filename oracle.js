const OracleContract = require('./build/contracts/BambooPriceOracle.json')
const contract = require('truffle-contract');
const fetchUrl = require('fetch').fetchUrl;
const Web3 = require('web3');

const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));


// Truffle abstraction to interact with our
// deployed contract
const oracle = contract(OracleContract);
oracle.setProvider(web3.currentProvider);

fetchUrl('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD&sign=true', etherPrice);

function etherPrice (error, meta, body) {
  if (error) { return console.error(error); }
  let result = JSON.parse(body.toString());
  let etherPrice = Number(result.USD);
  console.log(`Ether price is: ${etherPrice.toFixed(2)}`);

  // Dirty hack for web3@1.0.0 support for localhost testrpc
  // see https://github.com/trufflesuite/truffle-contract/issues/56#issuecomment-331084530
  if (typeof oracle.currentProvider.sendAsync !== "function") {
    oracle.currentProvider.sendAsync = function() {
      return oracle.currentProvider.send.apply(
        oracle.currentProvider, arguments
      );
    };
  }

  // Get accounts from web3
  web3.eth.getAccounts((error, accounts) => {
    if (error) { return console.error(error); }
    oracle.deployed()
    .then(oracleInstance => {
      console.log('Watching for events');
      // Watch event and respond to event
      // With a callback function
      oracleInstance.CallbackGetEtherPrice()
      .watch((error, event) => {
        if (error) { return console.error(error); }
        function setEtherPrice (error, meta, body) {
          if (error) { return console.error(error); }
          let result = JSON.parse(body.toString());
          let etherPrice = Number(result.USD);
          console.log(`Ether price is: ${etherPrice}`);
          return oracleInstance.setEtherPrice(etherPrice.toFixed(2) * 100, {from: accounts[0]});
        }
        // Fetch data
        // and update it into the contract
        fetchUrl('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD&sign=true', setEtherPrice);
        });
      })
    .catch(error => {
      if (error) {return console.error(error);}
    });
  });

}
