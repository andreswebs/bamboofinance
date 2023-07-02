pragma solidity ^0.4.24;

contract Owned {
    address public owner;
    event OwnershipTransferred(
        address indexed _previousOwner,
        address indexed _newOwner
    );

    constructor() public {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    function _transferOwnership(address _newOwner) internal {
        require(_newOwner != address(0));
        emit OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;
    }

    function transferOwnership(
        address _newOwner
    ) public onlyOwner returns (bool success) {
        _transferOwnership(_newOwner);
        return true;
    }
}
