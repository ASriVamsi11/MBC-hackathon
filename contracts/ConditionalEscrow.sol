// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ConditionalEscrow
 * @author ConditionalPay Team - MBC 2025 Hackathon
 * @notice Escrow contract that releases USDC based on Polymarket prediction outcomes
 * @dev Resolution is triggered by an off-chain resolver service that monitors Polymarket
 */
contract ConditionalEscrow is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Constants ============

    /// @notice Time after which depositor can reclaim funds if market never resolves
    uint256 public constant ESCROW_TIMEOUT = 7 days;

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
        uint256 amount;             // Amount of USDC (6 decimals)
        string marketId;            // Polymarket condition ID (e.g., "0x1234...")
        bool expectedOutcomeYes;    // If true, beneficiary wins when YES wins
        Status status;              // Current status of the escrow
        uint256 createdAt;          // Block timestamp when created
    }

    // ============ Storage ============

    /// @notice Mapping from escrow ID to escrow data
    mapping(uint256 => Escrow) public escrows;

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
     * @dev Caller must have approved this contract to spend `amount` USDC
     * @param beneficiary Address that receives funds if expectedOutcome occurs
     * @param amount USDC amount to escrow (6 decimals, e.g., 100000000 = 100 USDC)
     * @param marketId Polymarket condition ID to use as oracle
     * @param expectedOutcomeYes If true, beneficiary wins when market resolves YES
     * @return escrowId The ID of the newly created escrow
     */
    function createEscrow(
        address beneficiary,
        uint256 amount,
        string calldata marketId,
        bool expectedOutcomeYes
    ) external nonReentrant returns (uint256 escrowId) {
        // Validation
        if (beneficiary == address(0)) revert InvalidAddress();
        if (beneficiary == msg.sender) revert CannotEscrowToSelf();
        if (amount == 0) revert InvalidAmount();
        if (bytes(marketId).length == 0) revert InvalidMarketId();

        // Transfer USDC from caller to this contract
        // Note: Caller must have called usdc.approve(thisContract, amount) first
        usdc.safeTransferFrom(msg.sender, address(this), amount);

        // Create escrow
        escrowId = escrowCount++;

        escrows[escrowId] = Escrow({
            depositor: msg.sender,
            beneficiary: beneficiary,
            amount: amount,
            marketId: marketId,
            expectedOutcomeYes: expectedOutcomeYes,
            status: Status.Active,
            createdAt: block.timestamp
        });

        emit EscrowCreated(
            escrowId,
            msg.sender,
            beneficiary,
            amount,
            marketId,
            expectedOutcomeYes
        );
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

        if (escrow.amount == 0) revert EscrowDoesNotExist();
        if (escrow.status != Status.Active) revert EscrowNotActive();

        // Update status
        escrow.status = Status.Resolved;

        // Determine recipient
        // If actual outcome matches expected outcome → beneficiary wins
        // Otherwise → depositor gets refund
        address recipient;
        if (marketResolvedYes == escrow.expectedOutcomeYes) {
            recipient = escrow.beneficiary;
        } else {
            recipient = escrow.depositor;
        }

        // Transfer funds
        usdc.safeTransfer(recipient, escrow.amount);

        emit EscrowResolved(escrowId, recipient, escrow.amount, marketResolvedYes);
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

            // Skip if not valid/active (don't revert entire batch)
            if (escrow.amount == 0 || escrow.status != Status.Active) {
                continue;
            }

            escrow.status = Status.Resolved;

            address recipient = (outcomes[i] == escrow.expectedOutcomeYes)
                ? escrow.beneficiary
                : escrow.depositor;

            usdc.safeTransfer(recipient, escrow.amount);

            emit EscrowResolved(escrowIds[i], recipient, escrow.amount, outcomes[i]);
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

        if (escrow.amount == 0) revert EscrowDoesNotExist();
        if (escrow.status != Status.Active) revert EscrowNotActive();
        if (block.timestamp < escrow.createdAt + ESCROW_TIMEOUT) revert TimeoutNotReached();
        if (msg.sender != escrow.depositor && msg.sender != owner()) revert NotAuthorized();

        escrow.status = Status.Refunded;
        usdc.safeTransfer(escrow.depositor, escrow.amount);

        emit EscrowRefunded(escrowId, escrow.depositor, escrow.amount, "timeout");
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
     * @notice Check if an escrow can be emergency refunded
     * @param escrowId The ID of the escrow
     * @return canRefund Whether refund is currently possible
     * @return reason Human-readable explanation
     */
    function canEmergencyRefund(
        uint256 escrowId
    ) external view returns (bool canRefund, string memory reason) {
        Escrow memory escrow = escrows[escrowId];

        if (escrow.amount == 0) {
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