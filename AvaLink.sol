// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title AvaLink
 * @dev Hackathon-friendly contract for locking and distributing Ether
 */
contract AvaLink {
    address public host;
    
    event FundsLocked(uint256 amount);
    event FundsDistributed(uint256 totalAmount);
    
    modifier onlyHost() {
        require(msg.sender == host, "Only host can call this");
        _;
    }
    
    constructor() {
        host = msg.sender;
    }
    
    // Lock funds by sending Ether to this function
    function lockFunds() external payable onlyHost {
        require(msg.value > 0, "Must send Ether");
        emit FundsLocked(msg.value);
    }
    
    // Distribute funds to multiple addresses
    function distributeFunds(
        address[] memory recipients, 
        uint256[] memory amounts
    ) external onlyHost {
        require(recipients.length == amounts.length, "Arrays must match");
        
        uint256 total = 0;
        for (uint i = 0; i < amounts.length; i++) {
            total += amounts[i];
        }
        
        require(total <= address(this).balance, "Not enough balance");
        
        for (uint i = 0; i < recipients.length; i++) {
            if (amounts[i] > 0) {
                payable(recipients[i]).transfer(amounts[i]);
            }
        }
        
        emit FundsDistributed(total);
    }
    
    // Accept direct Ether transfers
    receive() external payable {
        emit FundsLocked(msg.value);
    }
    
    // View contract balance
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}