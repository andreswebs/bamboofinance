console.log('App loaded');

// Promisified XMLHttpRequest
function request (config) {
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest();
    xhr.open(config.method || 'GET', config.url);
    if (config.headers) {
        Object.keys(config.headers).forEach(key => {
            xhr.setRequestHeader(key, config.headers[key]);
        });
    }
    xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.response);
        } else {
            reject(xhr.statusText);
        }
    };
    xhr.onerror = () => reject(xhr.statusText);
    xhr.send(config.body);
  });
}

let loader = document.getElementById('loader');
let content = document.getElementById('content');

let sale;
let token;
let clientAccount;
let tokenPrice;
let defaultGas = 500000;

const App = {
  contracts: {},
  loading: false,
  init: function init () {
    console.log('App initialized');
    return this.initWeb3();
  },
  initWeb3: function initWeb3 () {
    if (typeof web3 !== undefined) {
      this.web3Provider = web3.currentProvider;
    }
    else {
      this.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
      web3 = new Web3(this.web3Provider);
    }
    return this.initContracts();
  },
  initContracts: function initContracts () {
    request({ url: 'BambooTokenSale.json' })
    .then(BambooTokenSale => {
      this.contracts.BambooTokenSale = TruffleContract(JSON.parse(BambooTokenSale));
      this.contracts.BambooTokenSale.setProvider(this.web3Provider);
      return this.contracts.BambooTokenSale.deployed();
    })
    .then(BambooTokenSale => {
      sale = BambooTokenSale;
      console.log('Bamboo Token Sale Address: ', sale.address);
      return request({ url: 'BambooFinance.json' });
    })
    .then(BambooFinance => {
      this.contracts.BambooFinance = TruffleContract(JSON.parse(BambooFinance));
      this.contracts.BambooFinance.setProvider(this.web3Provider);
      return this.contracts.BambooFinance.deployed();
    })
    .then(BambooFinance => {
      token = BambooFinance;
      console.log('Bamboo Finance Address: ', token.address);
      this.listenForEvents();
      return this.initAccount();
    })
    .catch(error => {
      if (error) { return console.error(error); }
    });
  },
  listenForEvents: function listenForEvents () {
    sale.Sell({}, {
      fromBlock: 0,
      toBlock: 'latest'
    })
    .watch((error, event) => {
      if (error) { return console.error(error); }
      console.log(`Event triggered: ${JSON.stringify(event)}`);
      return this.render();
    });
  },
  initAccount: function initAccount () {
    web3.eth.getCoinbase((error, account) => {
      if (error) { return console.error(error); }
      clientAccount = account;
      return this.render();
    });
  },
  render: function render () {
    if (this.loading) { return; }
    this.loading = true;
    content.style.display = 'none';
    loader.style.display = 'block';

    // Load sale data
    sale.tokenPrice()
    .then(price => {
      tokenPrice = price;
      document.getElementById('token-price').innerHTML = web3.fromWei(tokenPrice, 'ether').toNumber();
      return sale.tokensSold();
    })
    .then(tokensSold => {
      document.getElementById('tokens-sold').innerHTML = tokensSold.toNumber();
      document.getElementById('account-address').innerHTML = `Your Account: ${clientAccount}`;
      return token.balanceOf(clientAccount);
    })
    .then(balance => {
      document.getElementById('account-balance').innerHTML = balance.toNumber();
      this.loading = false;
      content.style.display = 'block';
      loader.style.display = 'none';
    })
    .catch(error => {
      if (error) { return console.error(error); }
    });
  },
  buyTokens: function buyTokens () {
    this.loading = true;
    content.style.display = 'none';
    loader.style.display = 'block';
    let numberOfTokens = document.getElementById('number-of-tokens').value;
    sale.buyTokens(numberOfTokens, {
      from: clientAccount,
      value: numberOfTokens * tokenPrice,
      gas: defaultGas
    })
    .then(result => {
      this.loading = false;
      content.style.display = 'block';
      loader.style.display = 'none';
      console.log(`Bought ${numberOfTokens} BAMBOO tokens`);
    })
    .catch(error => {
      if (error) { return console.error(error); }
    });;
  }
};

window.onload = App.init();
