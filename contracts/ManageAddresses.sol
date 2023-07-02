pragma solidity ^0.4.24;

library ManageAddresses {
    function _find(
        address[] _array,
        address _value
    ) internal pure returns (int index) {
        assert(_array.length > 0);
        for (uint i = 0; i < _array.length; i++) {
            if (_array[i] == _value) {
                return int(i);
            }
        }
        return -1;
    }

    function _removeByIndex(address[] _array, uint _index) internal pure {
        assert(_array.length > 0 && _index >= 0);
        _array[_index] = _array[_array.length - 1];
        delete _array[_array.length - 1];
    }

    function remove(address[] _array, address _value) internal pure {
        int i = _find(_array, _value);
        if (i >= 0) {
            _removeByIndex(_array, uint(i));
        }
    }
}
