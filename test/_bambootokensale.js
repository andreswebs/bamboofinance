const BambooFinance = artifacts.require('BambooFinance');
const BambooTokenSale = artifacts.require('BambooTokenSale');

contract('BambooTokenSale', function (accounts) {
  let sale;
  let token;
  let admin = accounts[0];
  let tokenPrice = 1000000000000000; // in Wei; check whether equal to migration

  // Get the Token and Sale instances before all tests
  before(function () {
    return BambooFinance.deployed()
    .then(contractInstance => {
      token = contractInstance;
      return BambooTokenSale.deployed();
    })
    .then(saleInstance => {
      sale = saleInstance;
      // Authorize the Sale contract to mint tokens
      return token.approveMint(sale.address, { from: admin });
    })
    .catch(error => {
      if (error) { return console.error(error); }
    });
  });


  describe('Initialization', function () {

    it('initializes the sale contract with the token address', function () {
      assert.notEqual(sale.address, 0x0, 'address must not be 0x0');
      return sale.token()
      .then(tokenAddress => {
        assert.notEqual(tokenAddress, 0x0, 'address must not be 0x0');
      });
    });

    it(`sets the token price to ${tokenPrice}`, function () {
      return BambooTokenSale.deployed()
      .then(instance => {
        sale = instance;
        return sale.tokenPrice();
      })
      .then(price => {
        assert.equal(price, tokenPrice, `token price must be equal to ${tokenPrice}`);
      });
    });

  }); // End of Initialization tests

  describe('Sale', function () {
    let buyer = accounts[5];
    let numberOfTokens = 100;
    let defaultGas = 500000;
    let value = numberOfTokens * tokenPrice;

    it('enables token buying', function () {
      return sale.buyTokens(numberOfTokens, { from: buyer, value: value })
      .then(receipt => {
        return token.balanceOf(buyer);
      })
      .then(balance => {
        assert.equal(balance.toNumber(), numberOfTokens, `buyer account must have ${numberOfTokens} in balance`);
        return sale.tokensSold();
      })
      .then(amount => {
        assert.equal(amount.toNumber(), numberOfTokens, 'must increment the number of tokens sold')
        // try to buy tokens for a different value
        return sale.buyTokens(numberOfTokens, { from: buyer, value: 1, gas: defaultGas });
      })
      .then(assert.fail).catch(error => {
        assert(error.message.indexOf('revert') >= 0, 'msg.value must be at least equal to cost of number of tokens in wei');
      });

    });

    it('emits a sell event', function () {
      return sale.buyTokens(numberOfTokens, { from: buyer, value: value, gas: defaultGas })
      .then(receipt => {
        assert.equal(receipt.logs.length, 1, 'must trigger one event');
        assert.equal(receipt.logs[0].event, 'Sell', 'must be the "Sell" event');
        assert.equal(receipt.logs[0].args._buyer, buyer, 'must log the buyer account');
        assert.equal(receipt.logs[0].args._amount, numberOfTokens, 'must log the number of tokens sold');
      });
    });

    it('ends the token sale', function () {
      // try to end sale from account other than the admin
      return sale.endSale({ from: buyer })
      .then(assert.fail).catch(error => {
        assert(error.message.indexOf('revert') >= 0, 'must be admin to end sale');
        return sale.endSale({ from: admin });
      })
      .then(receipt => {
        // check that token price was reset when selfdestruct was called
        return sale.tokenPrice();
      })
      .catch(error => {
        if (error) { return console.log(`Sale contract has self-destructed: ${error.message}`); }
      });
    });

  }); // End of Sale tests

});
