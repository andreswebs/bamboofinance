pragma solidity ^0.4.24;

import "./Owned.sol";

contract BambooPriceOracle is Owned {
    uint public etherPrice;

    mapping(address => bool) public approvedCaller;

    event CallbackGetEtherPrice();

    constructor(address _caller) public {
        approvedCaller[msg.sender] = true;
        approvedCaller[_caller] = true;
        updateEtherPrice();
    }

    modifier onlyApprovedCaller() {
        require(approvedCaller[msg.sender]);
        _;
    }

    function updateEtherPrice() public onlyApprovedCaller {
        emit CallbackGetEtherPrice();
    }

    function setCaller(
        address _account,
        bool _approval
    ) public onlyOwner returns (bool success) {
        require(_account != address(0));
        approvedCaller[_account] = _approval;
        return true;
    }

    function setEtherPrice(
        uint _price
    ) public onlyOwner returns (bool success) {
        etherPrice = _price;
        return true;
    }

    function getEtherPrice()
        public
        view
        onlyApprovedCaller
        returns (uint price)
    {
        return etherPrice;
    }
}
