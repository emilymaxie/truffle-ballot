# Learning Solidity by Example

I've been educating myself on blockchain — and in particular ethereum — for
several weeks weeks. I'm writing this post to educate other
experienced programmers on some of the "gotchas" of working with Solidty, Ethereum and
the Truffle framework.

In my limited experience with Solidity, TDD isn't quite a thing yet in this world.
However, testing is _super_ important for a smart contract, and there are many
lessons to be learned by taking some examples and putting them in a test
harness.

In this post, I'll talk about how I took the
[Ballot Contract](https://solidity.readthedocs.io/en/develop/solidity-by-example.html#voting)
from the Solidity documentation, dropped it into Truffle project, and wrote some tests around the methods and interfaces
that this contract gives us.

All example code for this project can be found
[here](https://github.com/bbrock25/truffle-ballot).


## Truffle framework

The [Truffle framework](http://truffleframework.com/) gives you a decent working
enviornment for writing and deploying Solidity contracts. You can create a
shell project really quickly utilizing the CLI. Additionally, it does the hard
work of managing your contracts, tests and migrations all in one place. The
project is still pretty young, but they have some decent tutorials and
documentation on the site.

## Data types in our example contract

When going through the Ballot Contract, it reminded me a lot of a class in
standard OOP developmet. Apparently they even support inheritance, not
demonstrated here.

### Structs

First off, structs make total sense, you see those more or less anywhere, we're
pretty much defining a custom data type and storing some things in that.

```
struct Voter {
  uint weight;
  bool voted;
  address delegate;
  uint vote;
}
```
Pretty much what you see is what you get here. You can create a struct and
assign these attribtues to it, and there you have it, data. You can create a
new Voter and access the attributes like this:
```
voter_a = Voter({
    weight: 1,
    voted: false,
    address: 0xabc123,
    vote: 0
})

if (voter_a.voted) {
    // do a thing
} else {
    // do another thing
}
```
Fairly straight forward... Also, you'll see a lot of hexadecimal in Solidity
development, especially when referencing addresses. (Note the address type above,
that'll be a hex thing.)

### Contract public attributes

Other items to note in the top of this voter contract, we have created three
public attributes on this: contract, chairperson, and proposals. This is where
we'll be storing everything of more or less importance to the contract, our
state.
```
address public chairperson;

mapping(address => Voter) public voters;

Proposal[] public proposals;
```
* _chairperson_ is the address of the owner of the contract
* _voters_ is a mapping of address to Voter structs, so you get a voter by looking
  up their address in that map. If a voter isn't found, it'll return a Voter
  stuct with default empty values.
* _proposals_, not a huge surprise here, an array of the proposals, referenced by
  a integer index. Proposal is a custom struct, also defined in this contract.

### Ballot constructor

Like other languages, the constructor takes arguments and will instantiate
an instance of this contract. However, with Solidity this doesn't just create
an instance in memory, rather it creates a transaction or contract that lives on
the public Ethererum blockchain. Also, slightly different from many other
examples out in the Ethereurm ecosystem, notice that this constructor takes in
an array of names as an argument. More on this later.
```
function Ballot(bytes32[] proposalNames) {
    chairperson = msg.sender;
    voters[chairperson].weight = 1;
    for (uint i = 0; i < proposalNames.length; i++) {
        createProposal(proposalNames[i]);
    }
}

function createProposal (bytes32 proposalName) {
    require(msg.sender == chairperson);
    proposals.push(Proposal({
        name: proposalName,
        voteCount: 0
    }));
}
```
This constructor does two things:
* Sets the chairperson as the message sender (whoever created this contract)
* Loops over the proposal names and adds them to the list of proposals

In the example on the Solidity documentation site, they pushed each proposal
into the proposals array directly in the constructor. I abstracted it out to
another function because I wanted to directly test that functionality.

The remainder of the contract is more or less straightforward. There are many
functions that either modify or access data. Lets dive into the functionality
by writing some tests!

## Getting our project set up

As mentioned above, we'll be using the Truffle framework for writing tests
around this contract. Let's create a new Truffle project.
```bash
# install truffle
npm install -g truffle

# install local ethereum test enviornmnet
npm install -g testrpc

# create our project directory
mkdir ballot
cd ballot

# initialize the project
truffle init
```
This will give you a new project with the following directory structure:
```
├── contracts
│   ├── ConvertLib.sol
│   ├── MetaCoin.sol
│   └── Migrations.sol
├── migrations
│   ├── 1_initial_migration.js
│   └── 2_deploy_contracts.js
├── test
│   ├── TestMetacoin.sol
│   └── metacoin.js
└── truffle.js
```
Go ahead and delete the following files, we won't need them:
* contracts/ConvertLib.sol
* contracts/MetaCoin.sol
* test/TestMetaCoin.sol
* test/metacoin.js

Now create the Ballot contract in the contracts directory, and paste the
example code from the Solidty documentation into it. The starting contract is also
available on this repository in case the Solidity folks ever remove that
example.

Last, update the `migrations/2_deploy_contracts.js` file to only migrate our
contract, and remove any references to the files that we already deleted.

Note that in the migrations file, that is what will be deploying the contract to
the Ethereum blockchain. If you want to instantiate the contract with some
default proposals, that's the place. Here is my migration file for example:
```
var Ballot = artifacts.require("./Ballot.sol");

module.exports = function(deployer) {
    deployer.deploy(Ballot, ['example proposal']);
};
```
As you can see, we are creating this Ballot contract with one proposal:
'example proposal'.

## Tests

Now, create a file in the tests directory for our ballot. Here we will only be
writing the Mocha / JavaScript tests for now. Solidity apparently is rolling out
its own unit testing utilities, and we'll save exploration there for another
day. Since we are interacting with the contract through the _testrpc_ server,
these tests will act more or less as integration tests against this contract.

There are definitely a few downsides to this method. The biggest drawback for me was
not having access to the Solidity runtime environment, making debugging
fairly difficult. I have gotten the error `invalid opcode` more times than I'd
like to admit, and to me, that's just not a super helpful error message.

The upside is that since these contracts do have financial implications,
it's nice to have a solid integration test suite around the various ways that the
contract could be used, and it will document nicely how we expect to use the
contract from a web service.

We'll be writing Mocha for our tests here, not quite as pretty as RSpec if
you're coming from the Ruby world, but it does the job. Another funny thing is
that the nature of interacting with these contracts through JavaScript, most everything
returns a promise, so these do get a bit hard to read over time.

Before we get started, you'll need to fire up the testrpc server. Run `testrpc`
from your command line. Now you have a local Ethereum blockchain running with 10
example accounts that all hold 100 Ethereum apiece for testing purposes.

### Truffle's contract block
```javascript
contract('Ballot', function(accounts) {
  it('our first test', function() {...});
});
```
So, the first thing that you should notice is that we're wrapping this testing
environment with the `contract` function. This is some 'syntastic sugar' that
Truffle provides us. Truffle calls this their "clean room environment," from the
docs themselves:

> Truffle provides a clean room environment when running your test files.
> When running your tests against the TestRPC, Truffle will use the TestRPC's
> advanced snapshotting features to ensure your test files don't share state
> with each other. When running against other Ethereum clients like go-ethereum,
> Truffle will re-deploy all of your migrations at the beginning of every test
> file to ensure you have a fresh set of contracts to test against a clean room
> environment when running your test files. When running your tests against the
> TestRPC, Truffle will use the TestRPC's advanced snapshotting features to
> ensure your test files don't share state with each other. When running against
> other Ethereum clients like go-ethereum, Truffle will re-deploy all of your
> migrations at the beginning of every test file to ensure you have a fresh set
> of contracts to test against.

Need to clean the state? Just create another contract block.

The next thing that you should notice is the `accounts` attribute that is
provided to the callback in the `contract` block. This is an array of the test
accounts that TestRPC provides us. `accounts[0]` is the creator of the contract,
and the rest are all just for testing the various interactions with the contract.

### Testing our constructor

Next, we'll want to test that our constructor was effectively run along with the
parameters that we defined in our migration file. These pieces should be fairly
straightforward, as we are only testing that the setup was performed correctly.
One item here of interest is that accessor methods, defined with the keyword
`static` in our contracts, will be called using the `.call()` method on that
given function, and each `call` returns a promise. You'll notice that most of
the interactions with the contracts return promises. While possibly a nice
feature in programming a web front end to the contract, it makes our tests a
little ugly / hard to read (coming from a Ruby background, at least).
```javascript
it("should initialize the owner as the chairperson", function() {
  var ballotInstance;
  return Ballot.deployed().then(function(instance) {
    ballotInstance = instance;
    return ballotInstance.chairperson.call();
  }).then(function(chairperson) {
    assert.equal(chairperson, accounts[0]);
  })
});

it("should be initialized with one proposal using the constuctor", function() {
  var ballotInstance;
  const FIRST_PROPOSAL_HEX = '46495253542050524f504f53414c';
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
```


### Modifying the state of our contract

Here are a few more examples. Note that for issuing a state
change, we do not call the `call` method, we just call the function directly.

```javascript
it("can create a proposal on the fly", function() {
  var ballotInstance;
  const BILL_FOR_PRESIDENT_HEX = '42696c6c20666f7220707265736964656e74'
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
    assert.equal(weight.toNumber(), 1, 'allowed user is registered to vote'); return ballotInstance.getVoterWeight.call(notAllowedUser); }).then(function(weight) {
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

```
On the last test here, we're wanting to specify who is sending the message.
You can do that easily by passing an object as the last argument in the function
and specifying the address of the sender in the `from` attribute of that object.

### Testing errors

Since this is a black box test enviroment, the best I could figure to test these
`require` statements in the contract itself was to ensure that whatever command
I executed was erroring really hard. So, we just check for errors using the God-given
capabilities of the promises we've come to know and love. Here's a quick
example of an expected failure:

```javascript
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
```

I do this a few times in the example repository, the key here is to check for
the failure in the second argument (callback) in the `then` statement. If you
are using a `catch` block you'll probably get some false positives.

## Accessing public attributes on a contract

So, in writing these tests, there were a number of situations where I wanted to
test the modifications that I was making to the state of the contract. For the
most part, I could get what I needed by calling `call` on the given attribute of
the contract, `chariperson` for example. However when accessing items that are
in arrays or maps, I had to write some accessor methods since the data
structures aren't made readily available to the javascript interface. Note the
following functions:
* getProposalsCount
* getVoterWeight
* winnerName

Additionally, strings are stored as byte arrays under the hood in a solidity
contract, so when you get them back, you'll be looking at some hexidecimal
representation of that string (also padded with spaces). If you check the
tests where I'm verifying the names for the proposals, you'll see that I'm
referencing the hex value of that string in the tests.  `¯\_(ツ)_/¯` I'm clearly
not a pro at this yet, and there is almost certainly a better way, or hopefully
will be here soon.


## Conclusion

Truffle seems like a decent framework for writing Solidity code, but the testing
environment leaves a lot to be desired. I understand that this is more or less
"black-box" testing, but I really hope that it becomes easier to work with
contract internals in the near future.

I hope that the post was helpful. The Ethereum movement is changing fast, and
there isn't a _huge_ body of knowledge out there yet regarding best practices.
But the underlying technology is hugely inspirational and has potential to
really change how we think about a large class of applications. I, for one, am
very excited to see where this DApp development world goes.
