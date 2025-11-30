// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, euint8, ebool, externalEuint32, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @dev Custom errors for gas optimization and better UX
error OnlyOwner();
error InvalidStakeAmount();
error GameNotFound();
error GameAlreadyResolved();
error InsufficientBalance();
error ZeroAddress();
error MaxMintExceeded();
error NoETHSent();
error OnlyGamePlayer();

/// @title Encrypted Dice Game Contract
/// @notice A dice rolling game with FHE encryption for privacy
/// @dev This contract uses FHEVM v0.9.1 for fully homomorphic encryption
/// @author Zama Community Contributors
contract EncryptedDiceGame is ZamaEthereumConfig {
    // Game constants
    uint256 public constant PAYOUT_MULTIPLIER = 195; // 1.95x payout
    uint256 public constant BASIS_POINTS = 100;
    uint256 public constant MIN_STAKE = 1 ether; // 1 ROLL minimum
    uint256 public constant MAX_STAKE = 1000 ether; // 1000 ROLL maximum
    uint256 public constant ROLL_TOKEN_RATE = 1000; // 1 ETH = 1000 ROLL
    uint256 public constant MAX_MINT = 10000 ether; // 10000 ROLL max mint

    // State variables
    address public owner;
    uint256 public gameCounter;

    // Encrypted balances (using euint32 for ROLL without decimals)
    mapping(address => euint32) public playerBalance;

    // Game struct
    struct Game {
        address player;
        euint8 prediction; // 0 for even, 1 for odd (encrypted)
        euint32 stakeAmount; // encrypted (ROLL without decimals)
        uint256 timestamp;
        bool isResolved;
    }

    // Game storage
    mapping(uint256 => Game) public games;

    // Events
    event GameStarted(uint256 indexed gameId, address indexed player, uint256 timestamp);
    event GameResolved(uint256 indexed gameId, address indexed player, uint256 timestamp);
    event TokensSwapped(address indexed user, uint256 ethAmount, uint256 rollAmount, bool ethToRoll);
    event TokensMinted(address indexed user, uint256 amount);
    event TreasuryFunded(address indexed funder, uint256 amount);

    // Modifiers
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }


    /// @notice Initialize the contract
    constructor() {
        owner = msg.sender;
        gameCounter = 0;
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

    /// @notice Roll dice - simplified with off-chain dice generation
    /// @param encryptedPrediction Encrypted prediction (0=even, 1=odd)
    /// @param predictionProof Proof for prediction
    /// @param encryptedDiceParity Encrypted dice parity (0=even, 1=odd) from frontend
    /// @param diceParityProof Proof for dice parity
    /// @param stakeAmount Stake amount in plaintext (uint32) - not encrypted to reduce gas cost
    /// @dev Dice value and parity are calculated off-chain and encrypted on frontend to reduce gas
    /// Contract only performs minimal FHE operations: prediction comparison and balance update
    /// Note: encryptedDiceValue and diceValueProof are kept in function signature for ABI compatibility
    /// but not used in current implementation to minimize gas cost
    function rollDice(
        externalEuint8 encryptedPrediction,
        bytes calldata predictionProof,
        externalEuint8 /* encryptedDiceValue */, // Reserved for future validation
        bytes calldata /* diceValueProof */, // Reserved for future validation
        externalEuint8 encryptedDiceParity,
        bytes calldata diceParityProof,
        uint32 stakeAmount
    ) external {
        // Basic validation
        require(stakeAmount > 0, "Invalid stake amount");

        // Decrypt prediction and dice parity from external encrypted values
        euint8 prediction = FHE.fromExternal(encryptedPrediction, predictionProof);
        euint8 diceParity = FHE.fromExternal(encryptedDiceParity, diceParityProof);
        
        // Convert plaintext stakeAmount to encrypted value
        euint32 encryptedStakeAmount = FHE.asEuint32(stakeAmount);

        // Deduct stake from balance immediately
        playerBalance[msg.sender] = FHE.sub(playerBalance[msg.sender], encryptedStakeAmount);

        // Check if player predicted correctly (only 1 FHE.eq() operation)
        // prediction: 0 = even, 1 = odd
        // diceParity: 0 = even, 1 = odd
        // won = (prediction == diceParity)
        ebool won = FHE.eq(prediction, diceParity);

        // Calculate payout - simplified: if won, add 2x stake, else add 0
        euint32 doubleStake = FHE.add(encryptedStakeAmount, encryptedStakeAmount);
        euint32 payout = FHE.select(won, doubleStake, FHE.asEuint32(0));
        playerBalance[msg.sender] = FHE.add(playerBalance[msg.sender], payout);

        // Set permissions - minimal: only balance needs allow
        FHE.allowThis(playerBalance[msg.sender]);
        FHE.allow(playerBalance[msg.sender], msg.sender);

        // Emit event with result
        uint256 currentGameId = gameCounter++;
        emit GameResolved(currentGameId, msg.sender, block.timestamp);
    }

    /// @notice Start a new dice game (DEPRECATED - use rollDice instead)
    /// @dev Kept for backward compatibility, but rollDice is preferred
    function startGame(
        externalEuint8 encryptedPrediction,
        bytes calldata predictionProof,
        uint32 stakeAmount
    ) external {
        // Decrypt prediction from external encrypted value
        euint8 prediction = FHE.fromExternal(encryptedPrediction, predictionProof);
        
        // Convert plaintext stakeAmount to encrypted value in contract
        euint32 encryptedStakeAmount = FHE.asEuint32(stakeAmount);

        // Create new game
        uint256 gameId = gameCounter++;
        Game storage game = games[gameId];
        game.player = msg.sender;
        game.prediction = prediction;
        game.stakeAmount = encryptedStakeAmount;
        game.timestamp = block.timestamp;
        game.isResolved = false;

        // Deduct stake from balance
        playerBalance[msg.sender] = FHE.sub(playerBalance[msg.sender], encryptedStakeAmount);

        // Set permissions
        FHE.allowThis(playerBalance[msg.sender]);
        FHE.allow(playerBalance[msg.sender], msg.sender);
        FHE.allowThis(game.prediction);
        FHE.allow(game.prediction, msg.sender);

        emit GameStarted(gameId, msg.sender, block.timestamp);
    }

    /// @notice Resolve a dice game (DEPRECATED - use rollDice instead)
    /// @dev Kept for backward compatibility, but rollDice is preferred
    function resolveGame(uint256 gameId) external {
        Game storage game = games[gameId];
        if (game.player != msg.sender) revert OnlyGamePlayer();
        if (game.isResolved) revert GameAlreadyResolved();

        // Generate random dice value (always 1 die)
        uint32 randomValue = uint32(
            uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, gameId))) % 6
        ) + 1;

        // Calculate if dice value is even (0) or odd (1) from plaintext
        uint8 isEvenPlaintext = uint8(randomValue % 2 == 0 ? 0 : 1);
        euint8 encryptedIsEven = FHE.asEuint8(isEvenPlaintext);

        // Check if player predicted correctly
        ebool won = FHE.eq(game.prediction, encryptedIsEven);

        // Calculate payout
        euint32 doubleStake = FHE.add(game.stakeAmount, game.stakeAmount);
        euint32 payout = FHE.select(won, doubleStake, FHE.asEuint32(0));
        playerBalance[msg.sender] = FHE.add(playerBalance[msg.sender], payout);

        // Set permissions
        FHE.allowThis(playerBalance[msg.sender]);
        FHE.allow(playerBalance[msg.sender], msg.sender);

        game.isResolved = true;

        emit GameResolved(gameId, msg.sender, block.timestamp);
    }

    /// @notice Get game details
    /// @param gameId the game ID
    /// @return player The player address
    /// @return timestamp Game creation timestamp
    /// @return isResolved Whether game is resolved
    function getGame(
        uint256 gameId
    ) external view returns (address player, uint256 timestamp, bool isResolved) {
        Game storage game = games[gameId];
        return (game.player, game.timestamp, game.isResolved);
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

    /// @notice Withdraw ETH (owner only)
    function withdrawETH() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    /// @notice Receive ETH
    receive() external payable {}

    /// @notice Fallback function
    fallback() external payable {}
}
