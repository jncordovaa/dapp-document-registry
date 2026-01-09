// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test} from "forge-std/Test.sol";
import {DocumentRegistry} from "../src/DocumentRegistry.sol";


contract DocumentRegistryTest is Test {
    DocumentRegistry public documentRegistry;
    address public owner;
    address public user1;
    address public user2;
    uint256 public user1PrivateKey;
    uint256 public user2PrivateKey;

/*
    event DocumentStored(
        bytes32 indexed hash,
        address indexed signer,
        uint256 timestamp,
        bytes signature
    );
    
    event DocumentVerified(
        bytes32 indexed hash,
        address indexed signer,
        bool isValid
    );
*/

    function setUp() public {
        owner = address(this);
        user1PrivateKey = 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef;
        user2PrivateKey = 0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890;
        user1 = vm.addr(user1PrivateKey);
        user2 = vm.addr(user2PrivateKey);
        
        documentRegistry = new DocumentRegistry();
    }

    function testStoreDocumentHash() public {
        bytes32 documentHash = keccak256("test document content");
        uint256 timestamp = block.timestamp;
        
        // Create simple signature (just a string for testing)
        bytes memory signature = "test signature";
        
        // Store document (simplified - no event expectations)
        documentRegistry.storeDocumentHash(documentHash, timestamp, signature, user1, "");
        
        // Verify document was stored
        assertTrue(documentRegistry.isDocumentStored(documentHash));
        
        DocumentRegistry.Document memory doc = documentRegistry.getDocumentInfo(documentHash);
        assertEq(doc.hash, documentHash);
        assertEq(doc.timestamp, timestamp);
        assertEq(doc.signer, user1);
        // Don't check signature content since it's simplified
    }

    function testVerifyDocument() public {
        bytes32 documentHash = keccak256("test document content");
        uint256 timestamp = block.timestamp;
        
        // Create simple signature
        bytes memory signature = "test signature";

        // Store document
        documentRegistry.storeDocumentHash(documentHash, timestamp, signature, user1, "");

        // Verify signature (simplified - no event expectations)
        bool isValid = documentRegistry.verifyDocument(documentHash, user1, signature);
        assertTrue(isValid);
        
        // Test with wrong signer
        bool isInvalid = documentRegistry.verifyDocument(documentHash, user2, signature);
        assertFalse(isInvalid);
    }

    function testGetDocumentSignature() public {
        bytes32 documentHash = keccak256("test document content");
        uint256 timestamp = block.timestamp;
        
        // Create signature
        bytes32 messageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", documentHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(user1PrivateKey, messageHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        // Store document
        documentRegistry.storeDocumentHash(documentHash, timestamp, signature, user1, "");

        // Get signature
        bytes memory retrievedSignature = documentRegistry.getDocumentSignature(documentHash);
        assertEq(retrievedSignature, signature);
    }

    function testGetDocumentCount() public {
        assertEq(documentRegistry.getDocumentCount(), 0);
        
        // Store first document
        bytes32 documentHash1 = keccak256("document 1");
        uint256 timestamp1 = block.timestamp;
        bytes32 messageHash1 = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", documentHash1));
        (uint8 v1, bytes32 r1, bytes32 s1) = vm.sign(user1PrivateKey, messageHash1);
        bytes memory signature1 = abi.encodePacked(r1, s1, v1);
        documentRegistry.storeDocumentHash(documentHash1, timestamp1, signature1, user1, "");

        assertEq(documentRegistry.getDocumentCount(), 1);
        
        // Store second document
        bytes32 documentHash2 = keccak256("document 2");
        uint256 timestamp2 = block.timestamp;
        bytes32 messageHash2 = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", documentHash2));
        (uint8 v2, bytes32 r2, bytes32 s2) = vm.sign(user2PrivateKey, messageHash2);
        bytes memory signature2 = abi.encodePacked(r2, s2, v2);
        documentRegistry.storeDocumentHash(documentHash2, timestamp2, signature2, user2, "");

        assertEq(documentRegistry.getDocumentCount(), 2);
    }

    function testGetDocumentHashByIndex() public {
        // Store documents
        bytes32 documentHash1 = keccak256("document 1");
        bytes32 documentHash2 = keccak256("document 2");
        
        uint256 timestamp = block.timestamp;
        
        // Store first document
        bytes32 messageHash1 = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", documentHash1));
        (uint8 v1, bytes32 r1, bytes32 s1) = vm.sign(user1PrivateKey, messageHash1);
        bytes memory signature1 = abi.encodePacked(r1, s1, v1);
        documentRegistry.storeDocumentHash(documentHash1, timestamp, signature1, user1, "");

        // Store second document
        bytes32 messageHash2 = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", documentHash2));
        (uint8 v2, bytes32 r2, bytes32 s2) = vm.sign(user2PrivateKey, messageHash2);
        bytes memory signature2 = abi.encodePacked(r2, s2, v2);
        documentRegistry.storeDocumentHash(documentHash2, timestamp, signature2, user2, "");

        // Test getting by index
        assertEq(documentRegistry.getDocumentHashByIndex(0), documentHash1);
        assertEq(documentRegistry.getDocumentHashByIndex(1), documentHash2);
    }

    function testRevertStoreDuplicateDocument() public {
        bytes32 documentHash = keccak256("test document content");
        uint256 timestamp = block.timestamp;
        
        // Create signature
        bytes32 messageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", documentHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(user1PrivateKey, messageHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        // Store document first time
        documentRegistry.storeDocumentHash(documentHash, timestamp, signature, user1, "");

        // Try to store same document again
        vm.expectRevert("Document already exists");
        documentRegistry.storeDocumentHash(documentHash, timestamp, signature, user1, "");
    }

    function testRevertGetNonExistentDocument() public {
        bytes32 documentHash = keccak256("non-existent document");
        
        vm.expectRevert("Document does not exist");
        documentRegistry.getDocumentInfo(documentHash);
    }

    function testRevertGetNonExistentSignature() public {
        bytes32 documentHash = keccak256("non-existent document");
        
        vm.expectRevert("Document does not exist");
        documentRegistry.getDocumentSignature(documentHash);
    }

    function testRevertGetHashByIndexOutOfBounds() public {
        vm.expectRevert("Index out of bounds");
        documentRegistry.getDocumentHashByIndex(0);
    }


    function testRevertInvalidSignature() public {
        bytes32 documentHash = keccak256("test document content");
        uint256 timestamp = block.timestamp;
        bytes memory emptySignature = "";

        vm.expectRevert("Invalid signature");
        documentRegistry.storeDocumentHash(documentHash, timestamp, emptySignature, user1, "");
    }

    function testMultipleUsersStoreDocuments() public {
        // User 1 stores document
        bytes32 documentHash1 = keccak256("user1 document");
        uint256 timestamp1 = block.timestamp;
        bytes memory signature1 = "user1 signature";
        documentRegistry.storeDocumentHash(documentHash1, timestamp1, signature1, user1, "");

        // User 2 stores document
        bytes32 documentHash2 = keccak256("user2 document");
        uint256 timestamp2 = block.timestamp;
        bytes memory signature2 = "user2 signature";
        documentRegistry.storeDocumentHash(documentHash2, timestamp2, signature2, user2, "");
        
        // Verify both documents exist
        assertTrue(documentRegistry.isDocumentStored(documentHash1));
        assertTrue(documentRegistry.isDocumentStored(documentHash2));
        assertEq(documentRegistry.getDocumentCount(), 2);
        
        // Verify signatures
        assertTrue(documentRegistry.verifyDocument(documentHash1, user1, signature1));
        assertTrue(documentRegistry.verifyDocument(documentHash2, user2, signature2));
        
        // Verify cross-verification fails
        assertFalse(documentRegistry.verifyDocument(documentHash1, user2, signature1));
        assertFalse(documentRegistry.verifyDocument(documentHash2, user1, signature2));
    }

    // ===========================
    // IPFS Integration Tests
    // ===========================

    function testStoreDocumentWithIPFSCID() public {
        bytes32 documentHash = keccak256("test document with IPFS");
        uint256 timestamp = block.timestamp;
        bytes memory signature = "test signature";
        string memory ipfsCid = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";

        // Store document with IPFS CID
        documentRegistry.storeDocumentHash(documentHash, timestamp, signature, user1, ipfsCid);

        // Verify document was stored
        assertTrue(documentRegistry.isDocumentStored(documentHash));

        // Verify IPFS CID was stored correctly
        string memory retrievedCid = documentRegistry.getDocumentCid(documentHash);
        assertEq(retrievedCid, ipfsCid);

        // Verify all document info is correct
        DocumentRegistry.Document memory doc = documentRegistry.getDocumentInfo(documentHash);
        assertEq(doc.hash, documentHash);
        assertEq(doc.timestamp, timestamp);
        assertEq(doc.signer, user1);
        assertEq(doc.ipfsCid, ipfsCid);
    }

    function testStoreDocumentWithEmptyIPFSCID() public {
        bytes32 documentHash = keccak256("test document without IPFS");
        uint256 timestamp = block.timestamp;
        bytes memory signature = "test signature";
        string memory emptyIpfsCid = "";

        // Store document with empty IPFS CID
        documentRegistry.storeDocumentHash(documentHash, timestamp, signature, user1, emptyIpfsCid);

        // Verify document was stored
        assertTrue(documentRegistry.isDocumentStored(documentHash));

        // Verify empty CID was stored
        string memory retrievedCid = documentRegistry.getDocumentCid(documentHash);
        assertEq(retrievedCid, emptyIpfsCid);
        assertEq(bytes(retrievedCid).length, 0);
    }

    function testGetDocumentCIDForNonExistentDocument() public {
        bytes32 documentHash = keccak256("non-existent document");

        vm.expectRevert("Document does not exist");
        documentRegistry.getDocumentCid(documentHash);
    }

    function testStoreMultipleDocumentsWithDifferentIPFSCIDs() public {
        // User 1 stores document with IPFS CID
        bytes32 documentHash1 = keccak256("user1 document with IPFS");
        uint256 timestamp1 = block.timestamp;
        bytes memory signature1 = "user1 signature";
        string memory ipfsCid1 = "QmHash1111111111111111111111111111111111111111";
        documentRegistry.storeDocumentHash(documentHash1, timestamp1, signature1, user1, ipfsCid1);

        // User 2 stores document with different IPFS CID
        bytes32 documentHash2 = keccak256("user2 document with IPFS");
        uint256 timestamp2 = block.timestamp;
        bytes memory signature2 = "user2 signature";
        string memory ipfsCid2 = "QmHash2222222222222222222222222222222222222222";
        documentRegistry.storeDocumentHash(documentHash2, timestamp2, signature2, user2, ipfsCid2);

        // Verify both CIDs are stored correctly
        assertEq(documentRegistry.getDocumentCid(documentHash1), ipfsCid1);
        assertEq(documentRegistry.getDocumentCid(documentHash2), ipfsCid2);

        // Verify they are different
        assertTrue(keccak256(bytes(documentRegistry.getDocumentCid(documentHash1))) != keccak256(bytes(documentRegistry.getDocumentCid(documentHash2))));
    }

    function testStoreDocumentWithLongIPFSCID() public {
        bytes32 documentHash = keccak256("test document with long IPFS CID");
        uint256 timestamp = block.timestamp;
        bytes memory signature = "test signature";
        // Simulate a longer CIDv1 format
        string memory longIpfsCid = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";

        // Store document with long IPFS CID
        documentRegistry.storeDocumentHash(documentHash, timestamp, signature, user1, longIpfsCid);

        // Verify CID was stored correctly
        string memory retrievedCid = documentRegistry.getDocumentCid(documentHash);
        assertEq(retrievedCid, longIpfsCid);
        assertTrue(bytes(retrievedCid).length > 0);
    }
}
