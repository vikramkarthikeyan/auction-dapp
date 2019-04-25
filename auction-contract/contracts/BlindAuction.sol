pragma solidity 0.5.1;

contract BlindAuction {
    struct Bid {
        bytes32 blindedBid;
        uint deposit;
    }

    // will be set by external agent not by time "now"
    enum Phase {Init, Bidding, Reveal, Done}  
    Phase public state = Phase.Init; 
    
       //modifiers
   modifier validPhase(Phase reqPhase) 
    { require(state == reqPhase); 
      _; 
    } 
    address payable beneficiary; //owner
    mapping(address => Bid) bids;  //only one bid allowed per address

    address public highestBidder;
    uint public highestBid =0;
    
    mapping(address => uint) pendingReturns;

    event AuctionEnded(address winner, uint highestBid);
    constructor(
        
    ) public {
        beneficiary = msg.sender;
        state = Phase.Bidding;
    }

    function changeState(Phase x) public {
        if (msg.sender != beneficiary) {revert();}
        if (x < state ) revert();
        state = x;
    }
    
    function bid(bytes32 _blindedBid)
        public
        payable
        validPhase(Phase.Bidding)
    {
        bids[msg.sender] = Bid({
            blindedBid: _blindedBid,
            deposit: msg.value
        });
    }

    
    function reveal(
        uint value,
        bytes32 secret
    )
        public validPhase(Phase.Reveal)
        
    {
       
        uint refund = 0;
        
            Bid storage bidToCheck = bids[msg.sender];
            if (bidToCheck.blindedBid == keccak256(abi.encodePacked(value, secret))) {
            refund += bidToCheck.deposit;
            if (bidToCheck.deposit >= value) {
                if (placeBid(msg.sender, value))
                    refund -= value;
            }}
            
        msg.sender.transfer(refund);
    }

    // This is an "internal" function which means that it
    // can only be called from the contract itself (or from
    // derived contracts).
    function placeBid(address bidder, uint value) internal
            returns (bool success)
    {
        if (value <= highestBid) {
            return false;
        }
        
        highestBid = value;
        highestBidder = bidder;
        return true;
    }

    /// Withdraw a non-winning bid
    function withdraw() public {
        uint amount = pendingReturns[msg.sender];
        if (amount > 0) {
            // It is important to set this to zero because the recipient
            // can call this function again as part of the receiving call
            // before `transfer` returns (see the remark above about
            // conditions -> effects -> interaction).
            pendingReturns[msg.sender] = 0;

            msg.sender.transfer(amount);
        }
    }
    
    /// End the auction and send the highest bid
    /// to the beneficiary.
    function auctionEnd()
        public
        validPhase(Phase.Done)
    {
        emit AuctionEnded(highestBidder, highestBid);
        beneficiary.transfer(highestBid);
    }
}
