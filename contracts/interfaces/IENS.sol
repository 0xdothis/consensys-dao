// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IENS Interface
 * @dev Interface for ENS registry and resolver interactions
 */
interface IENS {
    function resolver(bytes32 node) external view returns (address);
    function owner(bytes32 node) external view returns (address);
}

interface IENSResolver {
    function addr(bytes32 node) external view returns (address);
    function name(bytes32 node) external view returns (string memory);
    function text(bytes32 node, string calldata key) external view returns (string memory);
}

interface IENSReverseRegistrar {
    function claim(address owner) external returns (bytes32);
    function claimWithResolver(address owner, address resolver) external returns (bytes32);
    function setName(string memory name) external returns (bytes32);
}

interface IENSNameWrapper {
    function ownerOf(uint256 tokenId) external view returns (address);
    function isWrapped(bytes32 node) external view returns (bool);
}
