var Ballot = artifacts.require("./Ballot.sol");

contract('Ballot', function(accounts) {
  it("should initialize the owner as the chairperson", function() {
    var ballotInstance;
    return Ballot.deployed().then(function(instance) {
      ballotInstance = instance;
      return ballotInstance.chairperson.call();
    }).then(function(chairperson) {
      assert.equal(chairperson, accounts[0]);
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
      return ballotInstance.getVoterWeight(allowedUser);
    }).then(function(weight) {
      assert.equal(weight.toNumber(), 1, 'allowed user is registered to vote');
      return ballotInstance.getVoterWeight(notAllowedUser);
    }).then(function(weight) {
      assert.equal(weight.toNumber(), 0, 'a user not registered cannot vote');
    })
  })

  it("should allow the creation of proposals", function() {
    return Ballot.deployed().then(function(instance) {
      ballotInstance = instance;
      return ballotInstance.getProposalsCount.call();
    }).then(function(count) {
      assert.equal(count.toNumber(), 1, 'initialized with one proposal');
      return ballotInstance.createProposal('proposal A')
    }).then(function(_receipt) {
      return ballotInstance.getProposalsCount.call();
    }).then(function(count) {
      assert.equal(count.toNumber(), 2, 'proposal was successfully created');
    })
  })
});
