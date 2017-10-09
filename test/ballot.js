var Ballot = artifacts.require("./Ballot.sol");


contract('Ballot', function(accounts) {
  const FIRST_PROPOSAL_HEX = '46495253542050524f504f53414c';
  const BILL_FOR_PRESIDENT_HEX = '42696c6c20666f7220707265736964656e74'

  it("should initialize the contract owner as the chairperson", function() {
    var ballotInstance;
    return Ballot.deployed().then(function(instance) {
      ballotInstance = instance;
      return ballotInstance.chairperson.call();
    }).then(function(chairperson) {
      // in truffle, the the first account initiates the contract
      assert.equal(chairperson, accounts[0]);
    })
  });

  it("should be initialized with one proposal using the constuctor", function() {
    var ballotInstance;
    return Ballot.deployed().then(function(instance) {
      ballotInstance = instance;
      return ballotInstance.getProposalsCount.call();
    }).then(function(index) {
      return ballotInstance.getProposalName.call(index.toNumber() - 1);
    }).then(function(proposalName) {
      var str = proposalName.toString();
      var re = new RegExp(FIRST_PROPOSAL_HEX, 'i');

      assert.match(str, re, "default proposal should have been created during migrations");
    })
  });

  it("can create a proposal on the fly", function() {
    var ballotInstance;
    return Ballot.deployed().then(function(instance) {
      ballotInstance = instance;
      return ballotInstance.createProposal("Bill for president");
    }).then(function() {
      return ballotInstance.getProposalsCount.call();
    }).then(function(index) {
      return ballotInstance.getProposalName.call(index.toNumber() - 1);
    }).then(function(proposalName) {
      var str = proposalName.toString();
      var re = new RegExp(BILL_FOR_PRESIDENT_HEX, 'i');

      assert.match(str, re, "Bill for president was found!");
    })
  });

  it("should allow a user to vote on a proposal", function() {
    var ballotInstance;
    var allowedUser = accounts[1];
    var notAllowedUser = accounts[2];
    return Ballot.deployed().then(function(instance) {
      ballotInstance = instance;
      return ballotInstance.giveRightToVote(allowedUser)
    }).then(function(txReceipt) {
      return ballotInstance.getVoterWeight.call(allowedUser);
    }).then(function(weight) {
      assert.equal(weight.toNumber(), 1, 'allowed user is registered to vote');
      return ballotInstance.getVoterWeight.call(notAllowedUser);
    }).then(function(weight) {
      assert.equal(weight.toNumber(), 0, 'a user not registered cannot vote');
    })
  })

  it("should be able to effectively delegate", function() {
    return Ballot.deployed().then(function(instance) {
      ballotInstance = instance;
      return ballotInstance.giveRightToVote(accounts[3])
    }).then(function() {
      return ballotInstance.giveRightToVote(accounts[4])
    }).then(function(txReceipt) {
      return ballotInstance.delegate(accounts[3], { from: accounts[4] });
    }).then(function() {
      return ballotInstance.getVoterWeight.call(accounts[3]);
    }).then(function(weight) {
      assert.equal(weight.toNumber(), 2, "account 1 should be weighted");
    })
  })

  it("should not allow a voter to delegate to themselves", function() {
    return Ballot.deployed().then(function(instance) {
      ballotInstance = instance;
      return ballotInstance.delegate(accounts[0], { from: accounts[0] });
    }).then(function() {
      assert.fail('this should have failed');
    }, function(e) {
      // assuming bad opcode error here
      assert(true, 'we should have hit this point as a failure');
    })
  })
});

contract('Start a new contract fresh', function(accounts) {
  it("Has a clean slate here, only 1 proposal", function() {
    return Ballot.deployed().then(function(instance) {
      ballotInstance = instance;
    }).then(function() {
      return ballotInstance.getProposalsCount();
    }).then(function(count) {
      assert.equal(count.toNumber(), 1, "this is the count");
    })
  })
})
