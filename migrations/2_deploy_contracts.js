const BambooFinance = artifacts.require('BambooFinance');
const BambooTokenSale = artifacts.require('BambooTokenSale');
const BambooPriceOracle = artifacts.require('BambooPriceOracle');

const tokenPrice = 1000000000000000; // in Wei
const initialSupply = 777;
const initialValue = 100; // 1 USD
const contactInformation = 'Phone number: 123456';

module.exports = function (deployer) {
  deployer.deploy(BambooFinance, initialSupply, initialValue, contactInformation)
  .then(() => {
    return deployer.deploy(BambooTokenSale, BambooFinance.address, tokenPrice);
  })
  .then(() => {
    return deployer.deploy(BambooPriceOracle, BambooTokenSale.address);
  });
};
