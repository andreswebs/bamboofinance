pragma solidity ^0.4.24;

library SafeMath {
    using SafeMath for uint256;

    function multiply(uint256 _a, uint256 _b) internal pure returns (uint256) {
        if (_a == 0 || _b == 0) {
            return 0;
        }
        uint256 c = _a * _b;
        require(c / _a == _b);
        return c;
    }

    function divide(uint256 _a, uint256 _b) internal pure returns (uint256) {
        require(_b > 0);
        uint256 c = _a / _b;
        return c;
    }

    function subtract(uint256 _a, uint256 _b) internal pure returns (uint256) {
        require(_b <= _a);
        uint256 c = _a - _b;
        return c;
    }

    function add(uint256 _a, uint256 _b) internal pure returns (uint256) {
        uint256 c = _a + _b;
        require(c >= _a);
        return c;
    }

    function modulo(uint256 _a, uint256 _b) internal pure returns (uint256) {
        require(_b != 0);
        return _a % _b;
    }

    function dmultiply(
        uint256 _a,
        uint256 _b,
        uint256 _d
    ) internal pure returns (uint256) {
        uint256 c = _a.multiply(_b).add(_d.divide(2)).divide(_d);
        return c;
    }

    function ddivide(
        uint256 _a,
        uint256 _b,
        uint256 _d
    ) internal pure returns (uint256) {
        uint256 c = _a.multiply(_d).add(_b.divide(2)).divide(_b);
        return c;
    }

    // Computes `k * (1+1/q) ^ N`, with precision `p`. The higher
    // the precision, the higher the gas cost. It should be
    // something around the log of `n`. When `p == n`, the
    // precision is absolute (sans possible integer overflows). <edit: NOT true, see comments>
    // Much smaller values are sufficient to get a great approximation.
    function fracExp(
        uint k,
        uint q,
        uint n,
        uint p
    ) internal pure returns (uint) {
        uint s = 0;
        uint N = 1;
        uint B = 1;
        for (uint i = 0; i < p; ++i) {
            s += (k * N) / B / (q ** i);
            N = N * (n - i);
            B = B * (i + 1);
        }
        return s;
    }
}
