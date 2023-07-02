pragma solidity ^0.4.24;

import './BambooFinance.sol';

contract BambooTokenSale is Owned {
  using SafeMath for uint256;

  BambooFinance public token;
  uint public tokenPrice;
  uint public tokensSold;

  event Sell(address _buyer, uint _amount);

  constructor (BambooFinance _token, uint _tokenPrice) public {
    token = _token;
    tokenPrice = _tokenPrice;
  }

  function buyTokens (uint _amount) public payable {
    require(msg.value >= _amount.multiply(tokenPrice));
    require(token.mint(msg.sender, _amount));
    tokensSold = tokensSold.add(_amount);
    emit Sell(msg.sender, _amount);
  }

  function endSale () public onlyOwner {
    require(token.transfer(owner, token.balanceOf(this)));
    selfdestruct(owner);
  }

}
