// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract DigitalSignatureWhitelistContract is Ownable {
  using ECDSA for bytes32;

  /**
   * @notice Used to validate whitelist addresses
   */
  address private signerAddress = 0x4f5b20eaD662E7Cde0a4Ae035AfBcEa398A961E6;

  /**
   * @notice Verify signature
   */
  function verifyAddressSigner(
    bytes memory signature
  ) private view returns (bool) {
    bytes32 messageHash = keccak256(abi.encodePacked(msg.sender));

    return
      signerAddress == messageHash.toEthSignedMessageHash().recover(signature);
  }

  /**
   * @notice Function with whitelist
   */
  function whitelistFunc(bytes memory signature) external view {
    require(verifyAddressSigner(signature), "SIGNATURE_VALIDATION_FAILED");
    bytes32 hashed = getHashedMessageFromSignedMessage(signature);
    string memory converted = string(abi.encodePacked(hashed));
    console.log(converted);
  }

  function getHash(string memory _message) public pure returns (bytes32) {
    return keccak256(abi.encodePacked(_message));
  }

  function signMessage(
    bytes32 _hash,
    uint8 _v,
    bytes32 _r,
    bytes32 _s
  ) public pure returns (address) {
    return ecrecover(_hash, _v, _r, _s);
  }

  function verifySignature(
    address _signer,
    string memory _message,
    uint8 _v,
    bytes32 _r,
    bytes32 _s
  ) public pure returns (bool) {
    bytes32 hash = keccak256(abi.encodePacked(_message));
    address recovered = ecrecover(hash, _v, _r, _s);
    return recovered == _signer;
  }

  function getHashedMessageFromSignedMessage(
    bytes memory _signedMessage
  ) public view returns (bytes32) {
    // Extract the signature components (v, r, s) and message hash from the signed message
    bytes32 r;
    bytes32 s;
    uint8 v;

    assembly {
      r := mload(add(_signedMessage, 32))
      s := mload(add(_signedMessage, 64))
      v := byte(0, mload(add(_signedMessage, 96)))
    }

    // Example message hash
    bytes32 messageHash = keccak256(abi.encodePacked(msg.sender));

    // Recover the signer's address
    address signer = ecrecover(messageHash, v, r, s);

    // Hash the original message hash to get the hashed message of the signed message
    bytes32 hashedMessage = keccak256(abi.encodePacked(messageHash, signer));

    return hashedMessage;
  }
}
