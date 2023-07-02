pragma solidity ^0.4.24;

import "./SafeMath.sol";
import "./ManageAddresses.sol";
import "./Owned.sol";
import "./BambooPriceOracle.sol";
import "./ExponentLib.sol";

contract BambooFinance is Owned {
    using SafeMath for uint256;
    using ManageAddresses for address[];
    using ExponentLib for FixidityLib.Fixidity;

    string public name = "Bamboo Finance Token";
    string public symbol = "BAMBOO";
    string public contactInformation;
    uint8 public decimals = 0;
    uint8 internal digits = 5;
    uint public totalSupply;
    uint internal interestRate = 12000; // 5 digits of precision
    uint internal initialValue;
    uint internal start;
    uint internal totalCredit;
    uint internal etherPrice;
    BambooPriceOracle internal oracle;

    FixidityLib.Fixidity internal fixidity;

    address[] internal accounts;

    mapping(address => uint) public balanceOf;
    mapping(address => mapping(address => uint)) public allowance;
    mapping(address => bool) public approvedMint;
    mapping(address => uint) internal shares;

    event Transfer(address indexed _from, address indexed _to, uint _value);
    event Approval(
        address indexed _owner,
        address indexed _spender,
        uint _value
    );
    event SetMinter(address indexed _account, bool _approval);
    event Mint(address indexed _from, address indexed _to, uint _value);
    event Burn(address indexed _from, uint _value);
    event Withdraw(address indexed _account, uint _value);
    event Deposit(address indexed _account, uint _value);
    event Donation(address indexed _account, uint _value);
    event EndOfContract(address indexed _account);

    constructor(
        uint _initialSupply,
        uint _initialValue,
        string _contactInformation
    ) public {
        start = now;
        totalSupply = _initialSupply;
        initialValue = _initialValue;
        totalCredit = 0;
        balanceOf[msg.sender] = _initialSupply;
        approvedMint[msg.sender] = true;
        contactInformation = _contactInformation;
        fixidity.init(5); // Init fixed decimal precision library with 5 digits
    }

    // fallback function
    function() public payable {
        if (msg.value > 0) {
            emit Donation(msg.sender, msg.value);
        }
    }

    modifier onlyApprovedMint() {
        require(approvedMint[msg.sender]);
        _;
    }

    function setOracle(
        address _oracle
    ) public onlyOwner returns (bool success) {
        require(_oracle != address(0));
        oracle = BambooPriceOracle(_oracle);
        return true;
    }

    function _updateEtherPrice() internal {
        require(oracle != address(0));
        etherPrice = oracle.getEtherPrice();
    }

    function _mint(address _from, address _to, uint _value) internal {
        require(_to != address(0));
        if (balanceOf[_to] == 0) {
            accounts.push(_to);
        }
        balanceOf[_to] = balanceOf[_to].add(_value);
        totalSupply = totalSupply.add(_value);
        emit Mint(_from, _to, _value);
    }

    function _transfer(address _from, address _to, uint _value) internal {
        require(_to != address(0) && balanceOf[_from] >= _value);
        balanceOf[_from] = balanceOf[_from].subtract(_value);
        if (balanceOf[_from] == 0) {
            accounts.remove(_from);
            accounts.length--;
        }
        if (balanceOf[_to] == 0) {
            accounts.push(_to);
        }
        balanceOf[_to] = balanceOf[_to].add(_value);
        emit Transfer(_from, _to, _value);
    }

    function _burn(address _account, uint _value) internal {
        require(_account != address(0) && balanceOf[_account] >= _value);
        balanceOf[_account] = balanceOf[_account].subtract(_value);
        if (balanceOf[_account] == 0) {
            accounts.remove(_account);
            accounts.length--;
        }
        totalSupply = totalSupply.subtract(_value);
        emit Burn(_account, _value);
    }

    function setContactInformation(
        string _contactInformation
    ) public onlyOwner returns (bool success) {
        contactInformation = _contactInformation;
        return true;
    }

    function transfer(address _to, uint _value) public returns (bool success) {
        _transfer(msg.sender, _to, _value);
        return true;
    }

    function approve(
        address _spender,
        uint _value
    ) public returns (bool success) {
        require(_spender != address(0));
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function transferFrom(
        address _from,
        address _to,
        uint _value
    ) public returns (bool success) {
        require(allowance[_from][msg.sender] >= _value);
        allowance[_from][msg.sender] = allowance[_from][msg.sender].subtract(
            _value
        );
        _transfer(_from, _to, _value);
        return true;
    }

    function burn(uint _value) public returns (bool success) {
        _burn(msg.sender, _value);
        return true;
    }

    function burnFrom(
        address _from,
        uint _value
    ) public returns (bool success) {
        require(allowance[_from][msg.sender] >= _value);
        allowance[_from][msg.sender] = allowance[_from][msg.sender].subtract(
            _value
        );
        _burn(_from, _value);
        return true;
    }

    function setApprovedMint(
        address _account,
        bool _approval
    ) public onlyOwner returns (bool success) {
        require(_account != address(0));
        approvedMint[_account] = _approval;
        emit SetMinter(_account, _approval);
        return true;
    }

    function mint(
        address _to,
        uint _value
    ) public onlyApprovedMint returns (bool success) {
        _mint(msg.sender, _to, _value);
        return true;
    }

    function _calculateInterest(uint _balance) internal view returns (uint) {
        uint oneYear = 31104000;
        uint present = now;
        uint period = present
            .subtract(start)
            .multiply(uint(10 ** digits))
            .divide(oneYear.multiply(uint(10 ** digits)));
        uint interest = _balance
            .multiply(fixidity.power_e(fixidity.multiply(interestRate, period)))
            .divide(uint(10 ** digits));
        return interest;
    }

    function _calculateAccountShare(
        address _account
    ) internal view returns (uint share) {
        require(_account != address(0) && balanceOf[_account] > 0);
        uint value = _calculateInterest(balanceOf[_account]);
        return value.multiply(etherPrice);
    }

    function calculateShares() public onlyOwner returns (bool success) {
        require(accounts.length > 0);
        _updateEtherPrice();
        uint credit = 0;
        for (uint i = 0; i < accounts.length; i++) {
            uint share = _calculateAccountShare(accounts[i]);
            shares[accounts[i]] = share;
            credit.add(share);
        }
        totalCredit = credit;
        return true;
    }

    function getTotalCredit() public view onlyOwner returns (uint) {
        return totalCredit;
    }

    function deposit() public payable onlyApprovedMint returns (bool success) {
        emit Deposit(msg.sender, msg.value);
        return true;
    }

    function _sendShare(address _account, uint _value) internal {
        require(
            _value > 0 &&
                shares[_account] == _value &&
                address(this).balance >= _value
        );
        shares[_account] = 0;
        _burn(_account, balanceOf[_account]);
        _account.transfer(_value);
    }

    function withdrawShare() external returns (bool success) {
        require(shares[msg.sender] > 0);
        uint share = shares[msg.sender];
        _sendShare(msg.sender, share);
        emit Withdraw(msg.sender, share);
        return true;
    }

    function destroy(address _to) public onlyOwner {
        require(calculateShares());
        require(address(this).balance >= totalCredit);
        emit EndOfContract(msg.sender);
        uint share;
        for (uint i = 0; i < accounts.length; i++) {
            share = shares[accounts[i]];
            _sendShare(accounts[i], share);
        }
        selfdestruct(_to);
    }
}
