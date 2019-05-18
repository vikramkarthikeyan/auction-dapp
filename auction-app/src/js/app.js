App = {
    web3Provider: null,
    contracts: {},
    names: new Array(),
    url: 'http://127.0.0.1:7545',
    chairPerson:null,
    currentAccount:null,
    biddingPhases: {
        0: 'Bidding Not Started',
        1: 'Bidding Started',
        2: 'Reveal Started',
        3: 'Auction Ended'
    },

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
            App.contracts.mycontract = data;
            // Set the provider for our contract
            App.contracts.vote.setProvider(App.web3Provider);
            
            App.getChairperson();
            App.getCurrentPhase();
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
      App.contracts.vote.deployed().then(function(instance){
        return instance.goToNextPhase();
      })
      .then(function(result){
        console.log(result);
        if(result){
            if(parseInt(result.receipt.status) == 1){
                App.getCurrentPhase();
                return;
            }
            else{
                toastr["error"]("Error in changing to next Event");
            }
        } 
        else {
            toastr["error"]("Error in changing to next Event");
        }
      })
      .catch(function(err){
        toastr["error"]("Error in changing to next Event");
      });
  },
  
    handleBid: function() {
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
                    toastr.info("Your Bid is Placed!", "", {"iconClass": 'toast-info notification0'});
                  else
                    toastr["error"]("Error in Bidding. Bidding Reverted!");
              } else {
                toastr["error"]("Bidding Failed!");
              }   
          }).catch(function(err){
            toastr["error"]("Bidding Failed!");
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
                    toastr.info("Your Bid is Revealed!", "", {"iconClass": 'toast-info notification0'});
                  else
                    toastr["error"]("Error in Revealing. Bidding Reverted!");
              } else {
                toastr["error"]("Revealing Failed!");
              }   
          }).catch(function(err){
            toastr["error"]("Revealing Failed!");
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
        toastr.info("Highest bid is " + highestBid + "<br>" + "Winner is " + winner, "", {"iconClass": 'toast-info notification3'});
      }).catch(function(err){
        console.log(err.message);
        toastr["error"]("Error!");
      })
    },

    //Function to get the current phase of the auction
    getCurrentPhase: function() {
        App.contracts.vote.deployed().then(function(instance){
            return instance.currentPhase.call();
        })
        .then(function(result){
            console.log(result.toNumber());
            App.showNotification(result.toNumber());
        })
    },

    //Function to show the notification of auction phases
    showNotification: function(phase){
        var currentPhase = App.biddingPhases[phase];
        $('#current-phase').text(currentPhase);
        console.log(currentPhase,'notification'+String(phase));
        toastr.info(currentPhase, "", {"iconClass": 'toast-info notification'+String(phase)});
    }
  };
  
  
  $(function() {
    $(window).load(function() {
        App.init();
        //Notification UI config
        toastr.options = {
            "showDuration": "1000",
            "positionClass": "toast-top-left",
            "preventDuplicates": true,
            "closeButton": true
        };
    });
  });
  