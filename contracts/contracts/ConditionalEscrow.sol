// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Prediction-Powered Onchain Escrow
 * @author MBC 2025 Hackathon
 * @notice Escrow contract that releases USDC based on Polymarket prediction outcomes
 * @dev Resolution is triggered by an off-chain resolver service that monitors Polymarket
 */
contract ConditionalEscrow is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Constants ============

    /// @notice Time after which depositor can reclaim funds if market never resolves
    uint256 public constant ESCROW_TIMEOUT = 7 days;

    /// @notice Maximum username length
    uint256 public constant MAX_USERNAME_LENGTH = 32;

    // ============ State Variables ============

    /// @notice The USDC token contract (immutable after deployment)
    IERC20 public immutable usdc;

    /// @notice Address authorized to resolve escrows (can be updated by owner)
    address public resolver;

    /// @notice Total number of escrows created (also serves as next escrow ID)
    uint256 public escrowCount;

    // ============ Enums ============

    /// @notice Possible states for an escrow
    enum Status {
        Active,    // 0 - Awaiting market resolution
        Resolved,  // 1 - Paid out based on market outcome
        Refunded   // 2 - Returned to depositor (timeout or market voided)
    }

    // ============ Structs ============

    /// @notice Data structure for each escrow
    struct Escrow {
        address depositor;          // Who deposited the USDC
        address beneficiary;        // Who receives USDC if condition is met
        uint256 amountA;            // Amount staked by depositor (6 decimals)
        uint256 amountB;            // Amount staked by beneficiary (6 decimals)
        string marketId;            // Polymarket condition ID (e.g., "0x1234...")
        bool expectedOutcomeYes;    // If true, depositor wins when YES wins
        Status status;              // Current status of the escrow
        uint256 createdAt;          // Block timestamp when created
        bool beneficiaryAccepted;   // Whether beneficiary has accepted and locked funds
    }

    /// @notice User statistics
    struct UserStats {
        uint256 totalWon;           // Total USDC won
        uint256 totalLost;          // Total USDC lost
        uint256 escrowsCreated;     // Number of escrows created
        uint256 escrowsWon;         // Number of escrows won
        uint256 escrowsLost;        // Number of escrows lost
    }

    // ============ Storage ============

    /// @notice Mapping from escrow ID to escrow data
    mapping(uint256 => Escrow) public escrows;

    /// @notice User display names
    mapping(address => string) public usernames;

    /// @notice User statistics
    mapping(address => UserStats) public userStats;

    // ============ Events ============

    /// @notice Emitted when a new escrow is created
    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed depositor,
        address indexed beneficiary,
        uint256 amount,
        string marketId,
        bool expectedOutcomeYes
    );

    /// @notice Emitted when an escrow is resolved
    event EscrowResolved(
        uint256 indexed escrowId,
        address indexed recipient,
        uint256 amount,
        bool marketResolvedYes
    );

    /// @notice Emitted when an escrow is refunded
    event EscrowRefunded(
        uint256 indexed escrowId,
        address indexed depositor,
        uint256 amount,
        string reason
    );

    /// @notice Emitted when the resolver address is updated
    event ResolverUpdated(address indexed oldResolver, address indexed newResolver);

    /// @notice Emitted when a user sets their username
    event UsernameSet(address indexed user, string username);

    // ============ Errors ============

    error InvalidAddress();
    error InvalidAmount();
    error InvalidMarketId();
    error CannotEscrowToSelf();
    error EscrowNotActive();
    error EscrowDoesNotExist();
    error OnlyResolver();
    error TimeoutNotReached();
    error NotAuthorized();
    error UsernameTooLong();
    error UsernameEmpty();

    // ============ Constructor ============

    /**
     * @notice Deploy the ConditionalEscrow contract
     * @param _usdc Address of the USDC token contract
     * @param _resolver Address authorized to resolve escrows
     */
    constructor(address _usdc, address _resolver) Ownable(msg.sender) {
        if (_usdc == address(0)) revert InvalidAddress();
        if (_resolver == address(0)) revert InvalidAddress();

        usdc = IERC20(_usdc);
        resolver = _resolver;
    }

    // ============ External Functions: User ============

    /**
     * @notice Create a new conditional escrow
     * @dev Caller (depositor) must have approved this contract to spend `amountA` USDC
     * @param beneficiary Address that receives funds if expectedOutcome occurs
     * @param amountA USDC amount depositor is staking (6 decimals, e.g., 100000000 = 100 USDC)
     * @param amountB USDC amount beneficiary must stake to accept (6 decimals)
     * @param marketId Polymarket condition ID to use as oracle
     * @param expectedOutcomeYes If true, depositor wins when market resolves YES
     * @return escrowId The ID of the newly created escrow
     */
    function createEscrow(
        address beneficiary,
        uint256 amountA,
        uint256 amountB,
        string calldata marketId,
        bool expectedOutcomeYes
    ) external nonReentrant returns (uint256 escrowId) {
        // Validation
        if (beneficiary == address(0)) revert InvalidAddress();
        if (beneficiary == msg.sender) revert CannotEscrowToSelf();
        if (amountA == 0 || amountB == 0) revert InvalidAmount();
        if (bytes(marketId).length == 0) revert InvalidMarketId();

        // Transfer USDC from depositor to this contract
        usdc.safeTransferFrom(msg.sender, address(this), amountA);

        // Create escrow
        escrowId = escrowCount++;

        escrows[escrowId] = Escrow({
            depositor: msg.sender,
            beneficiary: beneficiary,
            amountA: amountA,
            amountB: amountB,
            marketId: marketId,
            expectedOutcomeYes: expectedOutcomeYes,
            status: Status.Active,
            createdAt: block.timestamp,
            beneficiaryAccepted: false
        });

        // Update stats
        userStats[msg.sender].escrowsCreated++;

        emit EscrowCreated(
            escrowId,
            msg.sender,
            beneficiary,
            amountA,
            marketId,
            expectedOutcomeYes
        );
    }

    /**
     * @notice Accept an escrow by depositing the required beneficiary amount
     * @dev Beneficiary must have approved this contract to spend `amountB` USDC
     * @param escrowId The ID of the escrow to accept
     */
    function acceptEscrow(uint256 escrowId) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];

        if (escrow.amountA == 0) revert EscrowDoesNotExist();
        if (escrow.status != Status.Active) revert EscrowNotActive();
        if (msg.sender != escrow.beneficiary) revert NotAuthorized();
        if (escrow.beneficiaryAccepted) revert("Escrow already accepted");

        // Transfer USDC from beneficiary to this contract
        usdc.safeTransferFrom(msg.sender, address(this), escrow.amountB);

        // Mark as accepted
        escrow.beneficiaryAccepted = true;
    }

    // ============ External Functions: Resolver ============

    /**
     * @notice Resolve an escrow based on Polymarket market outcome
     * @dev Only callable by the authorized resolver
     * @param escrowId The ID of the escrow to resolve
     * @param marketResolvedYes True if the Polymarket market resolved to YES
     */
    function resolveEscrow(
        uint256 escrowId,
        bool marketResolvedYes
    ) external nonReentrant {
        if (msg.sender != resolver) revert OnlyResolver();

        Escrow storage escrow = escrows[escrowId];

        if (escrow.amountA == 0) revert EscrowDoesNotExist();
        if (escrow.status != Status.Active) revert EscrowNotActive();
        if (!escrow.beneficiaryAccepted) revert("Escrow not yet accepted");

        // Update status
        escrow.status = Status.Resolved;

        // Total payout to winner
        uint256 totalAmount = escrow.amountA + escrow.amountB;

        // Determine recipient and update stats
        address recipient;
        if (marketResolvedYes == escrow.expectedOutcomeYes) {
            // Depositor wins (they predicted correctly)
            recipient = escrow.depositor;
            userStats[escrow.depositor].totalWon += totalAmount;
            userStats[escrow.depositor].escrowsWon++;
            userStats[escrow.beneficiary].totalLost += totalAmount;
            userStats[escrow.beneficiary].escrowsLost++;
        } else {
            // Beneficiary wins (depositor's prediction was wrong)
            recipient = escrow.beneficiary;
            userStats[escrow.beneficiary].totalWon += totalAmount;
            userStats[escrow.beneficiary].escrowsWon++;
            userStats[escrow.depositor].totalLost += totalAmount;
            userStats[escrow.depositor].escrowsLost++;
        }

        // Transfer all funds to winner
        usdc.safeTransfer(recipient, totalAmount);

        emit EscrowResolved(escrowId, recipient, totalAmount, marketResolvedYes);
    }

    /**
     * @notice Resolve multiple escrows in a single transaction (gas efficient)
     * @dev Skips invalid escrows instead of reverting
     * @param escrowIds Array of escrow IDs to resolve
     * @param outcomes Array of market outcomes (true = YES won)
     */
    function resolveEscrowBatch(
        uint256[] calldata escrowIds,
        bool[] calldata outcomes
    ) external nonReentrant {
        if (msg.sender != resolver) revert OnlyResolver();
        require(escrowIds.length == outcomes.length, "Array length mismatch");

        for (uint256 i = 0; i < escrowIds.length; i++) {
            Escrow storage escrow = escrows[escrowIds[i]];

            // Skip if not valid/active/accepted
            if (escrow.amountA == 0 || escrow.status != Status.Active || !escrow.beneficiaryAccepted) {
                continue;
            }

            escrow.status = Status.Resolved;

            uint256 totalAmount = escrow.amountA + escrow.amountB;

            address recipient;
            if (outcomes[i] == escrow.expectedOutcomeYes) {
                recipient = escrow.depositor;
                userStats[escrow.depositor].totalWon += totalAmount;
                userStats[escrow.depositor].escrowsWon++;
                userStats[escrow.beneficiary].totalLost += totalAmount;
                userStats[escrow.beneficiary].escrowsLost++;
            } else {
                recipient = escrow.beneficiary;
                userStats[escrow.beneficiary].totalWon += totalAmount;
                userStats[escrow.beneficiary].escrowsWon++;
                userStats[escrow.depositor].totalLost += totalAmount;
                userStats[escrow.depositor].escrowsLost++;
            }

            usdc.safeTransfer(recipient, totalAmount);

            emit EscrowResolved(escrowIds[i], recipient, totalAmount, outcomes[i]);
        }
    }

    // ============ External Functions: Safety ============

    /**
     * @notice Emergency refund if market never resolves
     * @dev Callable by depositor or owner after ESCROW_TIMEOUT period
     * @param escrowId The ID of the escrow to refund
     */
    function emergencyRefund(uint256 escrowId) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];

        if (escrow.amountA == 0) revert EscrowDoesNotExist();
        if (escrow.status != Status.Active) revert EscrowNotActive();
        if (block.timestamp < escrow.createdAt + ESCROW_TIMEOUT) revert TimeoutNotReached();
        if (msg.sender != escrow.depositor && msg.sender != owner()) revert NotAuthorized();

        escrow.status = Status.Refunded;

        // Refund depositor's amount
        usdc.safeTransfer(escrow.depositor, escrow.amountA);

        // If beneficiary accepted and deposited, refund their amount too
        if (escrow.beneficiaryAccepted) {
            usdc.safeTransfer(escrow.beneficiary, escrow.amountB);
            emit EscrowRefunded(escrowId, escrow.beneficiary, escrow.amountB, "timeout");
        }

        emit EscrowRefunded(escrowId, escrow.depositor, escrow.amountA, "timeout");
    }

    // ============ External Functions: Social ============

    /**
     * @notice Set your display name
     * @param _username Display name (1-32 characters)
     */
    function setUsername(string calldata _username) external {
        if (bytes(_username).length == 0) revert UsernameEmpty();
        if (bytes(_username).length > MAX_USERNAME_LENGTH) revert UsernameTooLong();
        
        usernames[msg.sender] = _username;
        emit UsernameSet(msg.sender, _username);
    }

    // ============ View Functions ============

    /**
     * @notice Get full details of an escrow
     * @param escrowId The ID of the escrow
     * @return The Escrow struct
     */
    function getEscrow(uint256 escrowId) external view returns (Escrow memory) {
        return escrows[escrowId];
    }

    /**
     * @notice Get user statistics
     * @param user Address to look up
     * @return stats The UserStats struct
     */
    function getUserStats(address user) external view returns (UserStats memory stats) {
        return userStats[user];
    }

    /**
     * @notice Get username for an address
     * @param user Address to look up
     * @return Username or empty string if not set
     */
    function getUsername(address user) external view returns (string memory) {
        return usernames[user];
    }

    /**
     * @notice Check if an escrow can be emergency refunded
     * @param escrowId The ID of the escrow
     * @return canRefund Whether refund is currently possible
     * @return reason Human-readable explanation
     */
    function canEmergencyRefund(
        uint256 escrowId
    ) external view returns (bool canRefund, string memory reason) {
        Escrow memory escrow = escrows[escrowId];

        if (escrow.amountA == 0) {
            return (false, "Escrow does not exist");
        }
        if (escrow.status != Status.Active) {
            return (false, "Escrow is not active");
        }
        if (block.timestamp < escrow.createdAt + ESCROW_TIMEOUT) {
            return (false, "Timeout period not reached");
        }

        return (true, "Refund available");
    }

    /**
     * @notice Get the timestamp when an escrow becomes refundable
     * @param escrowId The ID of the escrow
     * @return Timestamp when emergency refund becomes available
     */
    function getRefundAvailableTime(uint256 escrowId) external view returns (uint256) {
        return escrows[escrowId].createdAt + ESCROW_TIMEOUT;
    }

    /**
     * @notice Get multiple escrows at once (for pagination)
     * @param startId Starting escrow ID
     * @param count Number of escrows to return
     * @return escrowList Array of escrows
     */
    function getEscrows(uint256 startId, uint256 count) external view returns (Escrow[] memory escrowList) {
        uint256 endId = startId + count;
        if (endId > escrowCount) {
            endId = escrowCount;
        }
        
        uint256 length = endId - startId;
        escrowList = new Escrow[](length);
        
        for (uint256 i = 0; i < length; i++) {
            escrowList[i] = escrows[startId + i];
        }
        
        return escrowList;
    }

    /**
     * @notice Get escrows for a specific user (as depositor or beneficiary)
     * @dev Note: This is O(n) and may be expensive for many escrows. Use events for production.
     * @param user Address to look up
     * @return asDepositor Escrow IDs where user is depositor
     * @return asBeneficiary Escrow IDs where user is beneficiary
     */
    function getUserEscrows(address user) external view returns (
        uint256[] memory asDepositor,
        uint256[] memory asBeneficiary
    ) {
        // First pass: count
        uint256 depositorCount = 0;
        uint256 beneficiaryCount = 0;
        
        for (uint256 i = 0; i < escrowCount; i++) {
            if (escrows[i].depositor == user) depositorCount++;
            if (escrows[i].beneficiary == user) beneficiaryCount++;
        }
        
        // Second pass: fill arrays
        asDepositor = new uint256[](depositorCount);
        asBeneficiary = new uint256[](beneficiaryCount);
        
        uint256 dIdx = 0;
        uint256 bIdx = 0;
        
        for (uint256 i = 0; i < escrowCount; i++) {
            if (escrows[i].depositor == user) {
                asDepositor[dIdx++] = i;
            }
            if (escrows[i].beneficiary == user) {
                asBeneficiary[bIdx++] = i;
            }
        }
        
        return (asDepositor, asBeneficiary);
    }

    // ============ Admin Functions ============

    /**
     * @notice Update the resolver address
     * @dev Only callable by contract owner
     * @param _resolver New resolver address
     */
    function setResolver(address _resolver) external onlyOwner {
        if (_resolver == address(0)) revert InvalidAddress();

        address oldResolver = resolver;
        resolver = _resolver;

        emit ResolverUpdated(oldResolver, _resolver);
    }
}