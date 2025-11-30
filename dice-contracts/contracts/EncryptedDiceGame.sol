// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @dev Custom errors for gas optimization and better UX
error OnlyOwner();
error InsufficientBalance();
error ZeroAddress();
error MaxMintExceeded();
error NoETHSent();

/// @title FHE Token Swap Contract
/// @notice A token swap dApp with FHE encryption for privacy
/// @dev This contract uses FHEVM v0.9.1 for fully homomorphic encryption
/// @author Zama Community Contributors
contract FHETokenSwap is ZamaEthereumConfig {
    // Token swap constants
    uint256 public constant ROLL_TOKEN_RATE = 1000; // 1 ETH = 1000 ROLL
    uint256 public constant MAX_MINT = 10000 ether; // 10000 ROLL max mint

    // State variables
    address public owner;

    // Encrypted balances (using euint32 for ROLL without decimals)
    mapping(address => euint32) public playerBalance;

    // Events
    event TokensSwapped(address indexed user, uint256 ethAmount, uint256 rollAmount, bool ethToRoll);
    event TokensMinted(address indexed user, uint256 amount);
    event TreasuryFunded(address indexed funder, uint256 amount);
    event TokensTransferred(address indexed from, address indexed to, uint256 amount);

    // Modifiers
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }


    /// @notice Initialize the contract
    constructor() {
        owner = msg.sender;
    }

    /// @notice Mint ROLL tokens for testing
    /// @param amount Amount of ROLL tokens to mint (in ROLL units without decimals)
    function mintTokens(uint256 amount) external {
        if (amount > MAX_MINT) revert MaxMintExceeded();

        euint32 encryptedAmount = FHE.asEuint32(uint32(amount));
        playerBalance[msg.sender] = FHE.add(playerBalance[msg.sender], encryptedAmount);

        // Set permissions
        FHE.allowThis(playerBalance[msg.sender]);
        FHE.allow(playerBalance[msg.sender], msg.sender);

        emit TokensMinted(msg.sender, amount);
    }

    /// @notice Swap ETH for ROLL tokens
    /// @dev 1 ETH = 1000 ROLL (ROLL has no decimals, 1 ROLL = 1 unit)
    /// msg.value is in wei (1 ETH = 1e18 wei)
    /// ROLL amount = (msg.value / 1e18) * 1000 = ROLL units without decimals
    function swapETHForROLL() external payable {
        if (msg.value == 0) revert NoETHSent();

        // Calculate ROLL amount: normalize msg.value to ETH units, then multiply by rate
        // msg.value (wei) / 1e18 = ETH amount, ETH * 1000 = ROLL units
        uint256 rollAmount = (msg.value * ROLL_TOKEN_RATE) / 1 ether;
        
        // Ensure rollAmount fits in uint32
        require(rollAmount <= type(uint32).max, "ROLL amount too large for uint32");
        
        euint32 encryptedAmount = FHE.asEuint32(uint32(rollAmount));

        playerBalance[msg.sender] = FHE.add(playerBalance[msg.sender], encryptedAmount);

        // Set permissions
        FHE.allowThis(playerBalance[msg.sender]);
        FHE.allow(playerBalance[msg.sender], msg.sender);

        emit TokensSwapped(msg.sender, msg.value, rollAmount, true);
    }

    /// @notice Swap ROLL tokens for ETH
    /// @param rollAmount ROLL amount to swap (in ROLL units, no decimals)
    /// @param encryptedAmount Encrypted ROLL amount to swap
    /// @param amountProof Proof for the encrypted amount
    function swapROLLForETH(uint32 rollAmount, externalEuint32 encryptedAmount, bytes calldata amountProof) external {
        require(rollAmount > 0, "Amount must be greater than 0");
        
        // Calculate ETH amount: rollAmount / ROLL_TOKEN_RATE
        uint256 ethAmount = (uint256(rollAmount) * 1 ether) / ROLL_TOKEN_RATE;
        
        // Check contract has enough ETH
        require(address(this).balance >= ethAmount, "Insufficient contract ETH balance");
        
        euint32 encRollAmount = FHE.fromExternal(encryptedAmount, amountProof);

        // Deduct from balance
        playerBalance[msg.sender] = FHE.sub(playerBalance[msg.sender], encRollAmount);

        // Set permissions
        FHE.allowThis(playerBalance[msg.sender]);
        FHE.allow(playerBalance[msg.sender], msg.sender);

        // Send calculated ETH amount to user
        payable(msg.sender).transfer(ethAmount);

        emit TokensSwapped(msg.sender, ethAmount, rollAmount, false);
    }

    /// @notice Add ETH to contract treasury (only owner)
    /// @dev This function allows the owner to fund the contract for ROLL→ETH swaps
    function addTreasuryETH() external payable onlyOwner {
        require(msg.value > 0, "Must send ETH");
        emit TreasuryFunded(msg.sender, msg.value);
    }

    /// @notice Get contract ETH balance
    /// @return Contract's ETH balance in wei
    function getContractETHBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /// @notice Get player's encrypted balance
    /// @param player Player address
    /// @return Encrypted balance
    function getBalance(address player) external view returns (euint32) {
        return playerBalance[player];
    }




    /// @notice Make a player's balance publicly decryptable
    /// @param player The player whose balance should be made public
    function makeBalancePubliclyDecryptable(address player) external {
        // Only the player themselves or the owner can make balance public
        require(msg.sender == player || msg.sender == owner, "Unauthorized");
        
        FHE.makePubliclyDecryptable(playerBalance[player]);
    }

    /// @notice Get a player's encrypted balance (for public decryption)
    /// @param player The player's address
    /// @return The encrypted balance
    function getPlayerBalance(address player) external view returns (euint32) {
        return playerBalance[player];
    }

    /// @notice Transfer ROLL tokens to another address
    /// @param _to Recipient address
    /// @param _amount Plaintext amount (for validation)
    /// @param _encryptedAmount Encrypted ROLL amount to transfer
    /// @param _amountProof Proof for the encrypted amount
    function transferROLL(
        address _to,
        uint32 _amount,
        externalEuint32 _encryptedAmount,
        bytes calldata _amountProof
    ) external {
        require(_to != address(0), "Invalid recipient address");
        require(_to != msg.sender, "Cannot transfer to yourself");
        require(_amount > 0, "Amount must be greater than 0");
        
        euint32 encAmount = FHE.fromExternal(_encryptedAmount, _amountProof);
        
        // Subtract from sender
        playerBalance[msg.sender] = FHE.sub(playerBalance[msg.sender], encAmount);
        
        // Add to receiver
        playerBalance[_to] = FHE.add(playerBalance[_to], encAmount);
        
        // Set permissions for sender balance
        FHE.allowThis(playerBalance[msg.sender]);
        FHE.allow(playerBalance[msg.sender], msg.sender);
        
        // Set permissions for receiver balance
        FHE.allowThis(playerBalance[_to]);
        FHE.allow(playerBalance[_to], _to);
        
        emit TokensTransferred(msg.sender, _to, _amount);
    }

    /// @notice Withdraw ETH (owner only)
    function withdrawETH() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    /// @notice Receive ETH
    receive() external payable {}

    /// @notice Fallback function
    fallback() external payable {}
}
