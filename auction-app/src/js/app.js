App = {
  web3Provider: null,
  contracts: {},
  names: new Array(),
  url: 'http://127.0.0.1:7545',
  chairPerson:null,
  currentAccount:null,
  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
        // Is there is an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fallback to the TestRPC
      App.web3Provider = new Web3.providers.HttpProvider(App.url);
    }
    web3 = new Web3(App.web3Provider);

    ethereum.enable();

    App.populateAddress();
    return App.initContract();
  },

  initContract: function() {
      $.getJSON('BlindAuction.json', function(data) {
    // Get the necessary contract artifact file and instantiate it with truffle-contract
    var voteArtifact = data;
    App.contracts.vote = TruffleContract(voteArtifact);

    // Set the provider for our contract
    App.contracts.vote.setProvider(App.web3Provider);
    
    App.getChairperson();
    return App.bindEvents();
  });
  },

  bindEvents: function() {
    $(document).on('click', '#submit-bid', App.handleBid);
    $(document).on('click', '#change-phase', App.handlePhase);
    $(document).on('click', '#generate-winner', App.handleWinner);
    $(document).on('click', '#submit-reveal', App.handleReveal);

    //$(document).on('click', '#register', function(){ var ad = $('#enter_address').val(); App.handleRegister(ad); });
  },

  populateAddress : function(){
    new Web3(new Web3.providers.HttpProvider(App.url)).eth.getAccounts((err, accounts) => {
      jQuery.each(accounts,function(i){
        if(web3.eth.coinbase != accounts[i]){
          var optionElement = '<option value="'+accounts[i]+'">'+accounts[i]+'</option';
          jQuery('#enter_address').append(optionElement);  
        }
      });
    });
  },

  getChairperson : function(){
    App.contracts.vote.deployed().then(function(instance) {
      return instance;
    }).then(function(result) {
      App.chairPerson = result.constructor.currentProvider.selectedAddress.toString();
      App.currentAccount = web3.eth.coinbase;
      if(App.chairPerson != App.currentAccount){
        jQuery('#address_div').css('display','none');
        jQuery('#register_div').css('display','none');
      }else{
        jQuery('#address_div').css('display','block');
        jQuery('#register_div').css('display','block');
      }
    })
  },
  
  handlePhase: function(event){

    var bidInstance;
    var nextState;
    var nextStateText;
    var currentPhase = $("#current-phase").text();
    if(currentPhase == "Bidding")
    {
      nextState = 2;
      nextStateText = "Reveal";
    }
    else if(currentPhase == "Reveal")
    {
      nextState = 3;
      nextStateText = "Done";

    }
     else if(currentPhase == "Done")
    {
      nextState = 1;
      nextStateText = "Bidding";
    }

    App.contracts.vote.deployed().then(function(instance) {
      bidInstance = instance;
      return bidInstance.changeState(nextState);
    }).then(function(result, err){
        if(result){
            if(parseInt(result.receipt.status) == 1)
            {
              alert("State has been changed")
              $("#current-phase").text(nextStateText);
            }
            
            else
            alert("State change revert")
        } else {
            alert(addr + "State change failed")
        }   
    });
},

  handleBid: function() {
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
  },

    handleReveal: function() {
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
  },





  handleWinner : function() {
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
};


$(function() {
  $(window).load(function() {
    App.init();
  });
});
