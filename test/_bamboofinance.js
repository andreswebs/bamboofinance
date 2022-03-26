const BambooFinance = artifacts.require('BambooFinance');

contract('BambooFinance', function (accounts) {

  let token;
  let tokenName = 'Bamboo Finance Token';
  let tokenSymbol = 'BAMBOO';
  let initialSupply = 777; // check if this value is the same in migration
  let admin = accounts[0];
  let receiver = accounts[1];

  // Get the Token instance before all tests
  before(function () {
    return BambooFinance.deployed()
    .then(instance => {
      token = instance;
    })
    .catch(error => {
      if (error) { return console.error(error); }
    });
  });

  describe('Initialization', function () {

    it(`initializes the contract with name (${tokenName}) and symbol (${tokenSymbol})`, function () {
      return token.name()
      .then(name => {
        assert.equal(name, tokenName);
        return token.symbol();
      })
      .then(symbol => {
        assert.equal(symbol, tokenSymbol);
      })
      .catch(error => {
        if (error) { return console.error(error); }
      });

    });

    it(`sets the initial supply to ${initialSupply} upon deployment`, function () {

      return token.totalSupply()
      .then(totalSupply => {
        assert.equal(totalSupply.toNumber(), initialSupply, `must set the initial supply to ${initialSupply}`);
      })
      .catch(error => {
        if (error) { return console.error(error); }
      });

    });

    it('allocates the initial supply to the administrator', function () {

      return token.balanceOf(admin)
      .then(adminBalance => {
        assert.equal(adminBalance.toNumber(), initialSupply, 'must allocate the initial supply to the admin');
      })
      .catch(error => {
        if (error) { return console.error(error); }
      });
    });

  }); // End of Initialization tests

  describe('Transfer', function () {

    let adminBalance;
    let receiverBalance;
    let newSupply = 1000000;

    // Mint newSupply for admin
    before(function () {
      return token.mint(admin, newSupply)
    });

    beforeEach(function () {

      return token.balanceOf(admin)
      .then(balance => {
        adminBalance = balance.toNumber();
        return token.balanceOf(receiver);
      })
      .then(balance => {
        receiverBalance = balance.toNumber();
      })
      .catch(error => {
        if (error) { return console.error(error); }
      });

    });

    it('reverts failed transfers', function () {
      return token.transfer.call(receiver, 9999999999999999999)
      .then(assert.fail).catch(error => {
        assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
      });
    });

    it('transfer returns a boolean', function () {
      let value = 250000;
      return token.transfer.call(receiver, value, { from: admin})
      .then(success => {
        assert.equal(success, true, 'successful transfer must return true');
      })
      .catch(error => {
        if (error) { return console.error(error); }
      });
    });

    it('emits a transfer event', function () {
      let value = 50000;
      return token.transfer(receiver, value, { from: admin})
      .then(receipt => {
        assert.equal(receipt.logs.length, 1, 'triggers one event');
        assert.equal(receipt.logs[0].event, 'Transfer', 'should be the "Transfer" event');
        assert.equal(receipt.logs[0].args._from, admin, 'logs the sending account');
        assert.equal(receipt.logs[0].args._to, receiver, 'logs the receiving account');
        assert.equal(receipt.logs[0].args._value, value, 'logs the transfer amount');
      })
      .catch(error => {
        if (error) { return console.error(error); }
      });
    });

    it('adds the amount to the receiving account and deduces the amount from the sending account', function () {

      let value = 250000;
      return token.transfer(receiver, value, { from: admin })
      .then(receipt => {
        return token.balanceOf(receiver);
      })
      .then(balance => {
        assert.equal(balance.toNumber(), receiverBalance + value, 'must add the amount to the receiving account');
        return token.balanceOf(admin);
      })
      .then(balance => {
        assert.equal(balance.toNumber(), adminBalance - value, 'must deduce the amount from the sending account');
      })
      .catch(error => {
        if (error) { return console.error(error); }
      });

    });

  }); // End of Transfer tests


  describe('Delegated Transfer', function () {

    let spender = accounts[2];
    let owner = accounts[3];
    let ownerBalance;
    let spenderAllowance;

    before(function () {
      // give an amount of tokens to 'owner' account for testing
      let value = 10000;
      return token.mint(owner, value, { from: admin })
      .then(success => {
        return token.balanceOf(owner);
      })
      .then(balance => {
        ownerBalance = balance.toNumber();
      })
      .catch(error => {
        if (error) { return console.error(error); }
      });
    });

    beforeEach(function () {
      return token.balanceOf(owner)
      .then(balance => {
        ownerBalance = balance.toNumber();
        return token.allowance(owner, spender);
      })
      .then(allowance => {
        spenderAllowance = allowance.toNumber();
      })
      .catch(error => {
        if (error) { return console.error(error); }
      });
    });

    it('approves tokens for delegated transfer', function () {
      let value = 100;
      return token.approve.call(spender, value, { from: owner })
      .then(success => {
        assert.equal(success, true, 'successful approval must return true');
      })
      .catch(error => {
        if (error) { return console.error(error); }
      });
    });

    it('emits an approval event', function () {
      let value = 1000;
      return token.approve(spender, value, { from: owner })
      .then(receipt => {
        assert.equal(receipt.logs.length, 1, 'triggers one event');
        assert.equal(receipt.logs[0].event, 'Approval', 'should be the "Approval" event');
        assert.equal(receipt.logs[0].args._owner, owner, 'logs the owner account');
        assert.equal(receipt.logs[0].args._spender, spender, 'logs the spender account');
        assert.equal(receipt.logs[0].args._value, value, 'logs the approval amount');
      })
      .catch(error => {
        if (error) { return console.error(error); }
      });

    });

    it('stores the allowance for delegated transfer', function () {
      let value = 1000;
      return token.approve(spender, value, { from: owner })
      .then(success => {
        return token.allowance(owner, spender);
      })
      .then(allowance => {
        assert.equal(allowance.toNumber(), value, 'must store the allowance for delegated transfer');
      })
      .catch(error => {
        if (error) { return console.error(error); }
      });
    });

    it('handles delegated transfer', function () {

      let value = 100;
      // approve 'spender' account to spend a value from 'owner' account
      return token.approve(spender, value, {from: owner })
      .then(receipt => {
        return token.allowance(owner, spender);
      })
      .then(allowance => {
        spenderAllowance = allowance.toNumber();
        // try transferring something larger than approved amount
        return token.transferFrom.call(owner, receiver, spenderAllowance + 1, { from: spender });
      })
      .then(assert.fail).catch(error => {
        assert(error.message.indexOf('revert') >= 0, 'must not be possible to transfer value larger than approved amount');
        // try transferring something larger than the owner's balance
        return token.transferFrom.call(owner, receiver, ownerBalance + 1, { from: spender });
      })
      .then(assert.fail).catch(error => {
        assert(error.message.indexOf('revert') >= 0, `must not be possible to transfer value larger than owner's balance`);
      })
    });

    it('emits a transfer event', function () {
      let value = 100;
      return token.transferFrom(owner, receiver, value, { from: spender })
      .then(receipt => {
        assert.equal(receipt.logs.length, 1, 'must trigger one event');
        assert.equal(receipt.logs[0].event, 'Transfer', 'must be the "Transfer" event');
        assert.equal(receipt.logs[0].args._from, owner, 'must log the owner account');
        assert.equal(receipt.logs[0].args._to, receiver, 'must log the receiving account');
        assert.equal(receipt.logs[0].args._value, value, 'must log the transfer amount');
      });
    });

  }); // End of Delegated Transfer tests

});
