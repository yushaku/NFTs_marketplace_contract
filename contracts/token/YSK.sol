// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

import { PowerDelegationMixin } from "./PowerDelegation.sol";
import { DelegationType } from "../interfaces/enum.sol";

contract Yushaku is
  ERC20,
  ERC20Burnable,
  PowerDelegationMixin,
  ERC20Pausable,
  Ownable
{
  using SafeMath for uint256;

  uint256 public constant INITIAL_SUPPLY = 1_000_000_000 ether;
  uint256 public constant MINT_MIN_INTERVAL = 30 days;
  uint256 public immutable MINT_MAX_PERCENT;

  // @notice Number of snapshots of the token total supply.
  uint256 public _totalSupplySnapshotsCount;
  uint256 public _mintingRestrictedBefore;

  bytes32 public immutable DOMAIN_SEPARATOR;
  bytes public constant EIP712_VERSION = "1";
  bytes32 public constant EIP712_DOMAIN =
    keccak256(
      "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );

  bytes32 private constant PERMIT_TYPEHASH =
    keccak256(
      "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
    );

  /// @dev Mapping from (owner) => (next valid nonce) for EIP-712 signatures.
  mapping(address => uint256) internal _nonces;

  mapping(address => mapping(uint256 => Snapshot)) public _votingSnapshots;
  mapping(address => uint256) public _votingSnapshotsCounts;

  mapping(address => address) public _votingDelegates;

  mapping(address => mapping(uint256 => Snapshot))
    public _propositionPowerSnapshots;
  mapping(address => uint256) public _propositionPowerSnapshotsCounts;
  mapping(address => address) public _propositionPowerDelegates;

  /// @notice Snapshots of the token total supply, at each block where the total supply has changed.
  mapping(uint256 => Snapshot) public _totalSupplySnapshots;

  /**
   * @notice Constructor.
   * @param  distributor                           The address which will receive the initial supply of tokens.
   * @param  mintingRestrictedBefore               Timestamp, before which minting is not allowed.
   * @param  mintMaxPercent                        Can be minted how many % at each mint.
   */

  constructor(
    address distributor,
    uint256 mintingRestrictedBefore,
    uint256 mintMaxPercent
  ) ERC20("Yushaku", "YSK") Ownable() {
    require(
      mintingRestrictedBefore > block.timestamp,
      "MINTING_RESTRICTED_BEFORE_TOO_EARLY"
    );

    uint256 chainId;
    assembly {
      chainId := chainid()
    }

    DOMAIN_SEPARATOR = keccak256(
      abi.encode(
        EIP712_DOMAIN,
        keccak256(bytes("Yushaku")),
        keccak256(bytes(EIP712_VERSION)),
        chainId,
        address(this)
      )
    );

    _mintingRestrictedBefore = mintingRestrictedBefore;
    MINT_MAX_PERCENT = mintMaxPercent;
    _mint(distributor, INITIAL_SUPPLY);
  }

  function pause() public onlyOwner {
    _pause();
  }

  function unpause() public onlyOwner {
    _unpause();
  }

  /**
   * @notice Mint new tokens. Only callable by owner after the required time period has elapsed.
   *
   * @param  recipient  The address to receive minted tokens.
   * @param  amount     The number of tokens to mint.
   */
  function mint(address recipient, uint256 amount) external onlyOwner {
    require(block.timestamp >= _mintingRestrictedBefore, "MINT_TOO_EARLY");
    require(
      amount <= totalSupply().mul(MINT_MAX_PERCENT).div(100),
      "MAX_MINT_EXCEEDED"
    );

    _mintingRestrictedBefore = block.timestamp.add(MINT_MIN_INTERVAL);
    _mint(recipient, amount);
  }

  /**
   * @notice Implements the permit function as specified in EIP-2612.
   *
   * @param  owner     Address of the token owner.
   * @param  spender   Address of the spender.
   * @param  value     Amount of allowance.
   * @param  deadline  Expiration timestamp for the signature.
   * @param  v         Signature param.
   * @param  r         Signature param.
   * @param  s         Signature param.
   */
  function permit(
    address owner,
    address spender,
    uint256 value,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external {
    require(owner != address(0), "INVALID_OWNER");
    require(block.timestamp <= deadline, "INVALID_EXPIRATION");
    uint256 currentValidNonce = _nonces[owner];
    bytes32 digest = keccak256(
      abi.encodePacked(
        "\x19\x01",
        DOMAIN_SEPARATOR,
        keccak256(
          abi.encode(
            PERMIT_TYPEHASH,
            owner,
            spender,
            value,
            currentValidNonce,
            deadline
          )
        )
      )
    );

    require(owner == ecrecover(digest, v, r, s), "INVALID_SIGNATURE");
    _nonces[owner] = currentValidNonce.add(1);
    _approve(owner, spender, value);
  }

  /**
   * @notice Get the next valid nonce for EIP-712 signatures.
   *
   * This nonce should be used when signing for any of the following functions:
   * - permit()
   * - delegateByTypeBySig()
   * - delegateBySig()
   */
  function nonces(address owner) external view returns (uint256) {
    return _nonces[owner];
  }

  /**
   * @dev Override _mint() to write a snapshot whenever the total supply changes.
   *
   * These snapshots are intended to be used by the governance strategy.
   * Note that the ERC20 _burn() function is never used. If desired, an official burn mechanism
   * could be implemented external to this contract, and accounted for in the governance strategy.
   */
  function _mint(address account, uint256 amount) internal override {
    super._mint(account, amount);

    uint256 snapshotsCount = _totalSupplySnapshotsCount;
    uint128 currentBlock = uint128(block.number);
    uint128 newValue = uint128(totalSupply());

    // Note: There is no special case for the total supply being updated multiple times in the same block.
    // because it only mint one time per month.
    // That should never occur.
    _totalSupplySnapshots[snapshotsCount] = Snapshot(currentBlock, newValue);
    _totalSupplySnapshotsCount = snapshotsCount.add(1);
  }

  /**
   * @dev Writes a snapshot before any transfer operation, including: _transfer, _mint and _burn.
   *  - On _transfer, it writes snapshots for both 'from' and 'to'.
   *  - On _mint, only for `to`.
   *  - On _burn, only for `from`.
   *
   * @param  from    The sender.
   * @param  to      The recipient.
   * @param  amount  The amount being transfered.
   */
  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) internal override(ERC20, ERC20Pausable) {
    require(!paused(), "ERC20Pausable: token transfer while paused");

    address votingFromDelegatee = _getDelegatee(from, _votingDelegates);
    address votingToDelegatee = _getDelegatee(to, _votingDelegates);

    _moveDelegatesByType(
      votingFromDelegatee,
      votingToDelegatee,
      amount,
      DelegationType.VOTING_POWER
    );

    address propPowerFromDelegatee = _getDelegatee(
      from,
      _propositionPowerDelegates
    );
    address propPowerToDelegatee = _getDelegatee(
      to,
      _propositionPowerDelegates
    );

    _moveDelegatesByType(
      propPowerFromDelegatee,
      propPowerToDelegatee,
      amount,
      DelegationType.PROPOSITION_POWER
    );
  }

  function _getDelegationDataByType(
    DelegationType delegationType
  )
    internal
    view
    override
    returns (
      mapping(address => mapping(uint256 => Snapshot)) storage, // snapshots
      mapping(address => uint256) storage, // snapshots count
      mapping(address => address) storage // delegatees list
    )
  {
    if (delegationType == DelegationType.VOTING_POWER) {
      return (_votingSnapshots, _votingSnapshotsCounts, _votingDelegates);
    } else {
      return (
        _propositionPowerSnapshots,
        _propositionPowerSnapshotsCounts,
        _propositionPowerDelegates
      );
    }
  }

  /**
   * @dev Delegates specific governance power from signer to `delegatee` using an EIP-712 signature.
   *
   * @param  delegatee       The address to delegate votes to.
   * @param  delegationType  The type of delegation (VOTING_POWER, PROPOSITION_POWER).
   * @param  nonce           The signer's nonce for EIP-712 signatures on this contract.
   * @param  expiry          Expiration timestamp for the signature.
   * @param  v               Signature param.
   * @param  r               Signature param.
   * @param  s               Signature param.
   */
  function delegateByTypeBySig(
    address delegatee,
    DelegationType delegationType,
    uint256 nonce,
    uint256 expiry,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) public {
    bytes32 structHash = keccak256(
      abi.encode(
        DELEGATE_BY_TYPE_TYPEHASH,
        delegatee,
        uint256(delegationType),
        nonce,
        expiry
      )
    );
    bytes32 digest = keccak256(
      abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash)
    );
    address signer = ecrecover(digest, v, r, s);
    require(signer != address(0), "INVALID_SIGNATURE");
    require(nonce == _nonces[signer]++, "INVALID_NONCE");
    require(block.timestamp <= expiry, "INVALID_EXPIRATION");
    _delegateByType(signer, delegatee, delegationType);
  }

  /**
   * @dev Delegates both governance powers from signer to `delegatee` using an EIP-712 signature.
   *
   * @param  delegatee  The address to delegate votes to.
   * @param  nonce      The signer's nonce for EIP-712 signatures on this contract.
   * @param  expiry     Expiration timestamp for the signature.
   * @param  v          Signature param.
   * @param  r          Signature param.
   * @param  s          Signature param.
   */
  function delegateBySig(
    address delegatee,
    uint256 nonce,
    uint256 expiry,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) public {
    bytes32 structHash = keccak256(
      abi.encode(DELEGATE_TYPEHASH, delegatee, nonce, expiry)
    );
    bytes32 digest = keccak256(
      abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash)
    );
    address signer = ecrecover(digest, v, r, s);
    require(signer != address(0), "INVALID_SIGNATURE");
    require(nonce == _nonces[signer]++, "INVALID_NONCE");
    require(block.timestamp <= expiry, "INVALID_EXPIRATION");
    _delegateByType(signer, delegatee, DelegationType.VOTING_POWER);
    _delegateByType(signer, delegatee, DelegationType.PROPOSITION_POWER);
  }
}
