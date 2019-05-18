
let BlockchainURL =  'http://127.0.0.1:7545';
let biddingContract;
let biddingPhases = {
    0: {'msg':'Bidding Not Started','type':'info'},
    1: {'msg':'Bidding Started','type':'success'},
    2: {'msg':'Reveal Started','type':'success'},
    3: {'msg':'Auction Ended','type':'success'}
}

function initContract() {
    $.getJSON('BlindAuction.json', function(data) {
        biddingContract = web3.eth
                            .contract(JSON.parse(data.metadata).output.abi)
                            .at(data.networks['5777'].address);
        getCurrentPhase();
    });
}

function bindEvents() {
    $('#submit-bid').on('click', function(){handleBid()});
    $('#change-phase').on('click', function(){handlePhase()});
    $('#generate-winner').on('click', function(){handleWinner()});
    $('#submit-reveal').on('click', function(){handleReveal()});
}

function getCurrentPhase() {
    biddingContract.currentPhase(function(err, result){
        showNotification(result.toNumber());
    });
}

var intiEv = false;
function handlePhase(){
    biddingContract.goToNextPhase(function(err, result){
        console.log(err,result);
        if(initEv == false){
            initEvents();
            initEv = true;
        }
    });     
}

function initEvents(){
    var biddingEvent = biddingContract.BiddingStarted();
    var revealEvent = biddingContract.RevealStarted();
    var initEvent = biddingContract.AuctionInit();

    initEvent.watch(function(err,result){
        console.log(err,result);
        var showErrNotification = true;
        if('transactionHash' in result){
            showErrNotification = false;
            getCurrentPhase();
        }
        setTimeout(function(){
            if(showErrNotification == true)
                toastr["error"]("Init Event Error");
        }, 10000);
    })

    biddingEvent.watch(function(err,result){
        console.log(err,result);
        var showErrNotification = true;
        if('transactionHash' in result){
            showErrNotification = false;
            getCurrentPhase();
        }
        setTimeout(function(){
            if(showErrNotification == true)
                toastr["error"]("Bidding Event Error");
        }, 10000);
    });

    revealEvent.watch(function(err,result){
        console.log(err,result);
        var showErrNotification = true;
        if('transactionHash' in result){
            showErrNotification = false;
            getCurrentPhase();
        }
        setTimeout(function(){
            if(showErrNotification == true)
                toastr["error"]("Reveal Event Error");
        }, 10000);
    });
}

function handleBid() {
    console.log("button clicked");
    event.preventDefault();
    var bidValue = $("#bet-value").val();
    var msgValue = $("#message-value").val();
    web3.eth.getAccounts(function(error, accounts) {
      var account = accounts[0];

      App.contracts.vote.deployed().then(function(instance) {
        bidInstance = instance;

        return bidInstance.bid(bidValue,{value:web3.toWei(msgValue, "ether")});
      }).then(function(result, err){
            if(result){
                console.log(result.receipt.status);
                if(parseInt(result.receipt.status) == 1)
                alert(account + "Your bid has been placed")
                else
                alert(account + "Bidding reverted")
            } else {
                alert(account + "Bidding failed")
            }   
        });
    });
}

function handleReveal() {
    console.log("button clicked");
    event.preventDefault();
    var bidRevealValue = $("#bet-reveal").val();
    console.log(parseInt(bidRevealValue));
    var bidRevealSecret = $("#password").val();
    web3.eth.getAccounts(function(error, accounts) {
      var account = accounts[0];

      App.contracts.vote.deployed().then(function(instance) {
        bidInstance = instance;

        return bidInstance.reveal(parseInt(bidRevealValue),bidRevealSecret);
      }).then(function(result, err){
            if(result){
                console.log(result.receipt.status);
                if(parseInt(result.receipt.status) == 1)
                alert(account + "Congratulations your bid has been revealed")
                else
                alert(account + "Bidding reverted")
            } else {
                alert(account + "Bidding failed")
            }   
        });
    });
  }

function handleWinner() {
    console.log("To get winner");
    var bidInstance;
    App.contracts.vote.deployed().then(function(instance) {
      bidInstance = instance;
      return bidInstance.auctionEnd();
    }).then(function(res){
    var winner = res.logs[0].args.winner;
    var highestBid = res.logs[0].args.highestBid.c[0];
    alert("Highest bid is " + highestBid + "\n" + "Winner is" + winner);

    }).catch(function(err){
      console.log(err.message);
    })
}

function showNotification(phase){
    var currentPhase = biddingPhases[phase];
    $('#current-phase').text(currentPhase.msg);
    toastr[currentPhase.type](currentPhase.msg);    
}

$(function() {
    $(window).load(function() {
        if (typeof web3 !== 'undefined') {
            web3 = new Web3(web3.currentProvider);
        } else {
            web3 = new Web3(new Web3.providers.HttpProvider(BlockchainURL));
        }
        toastr.options = {"showDuration": "500"};
        initContract();
        bindEvents();
        
  });
});
