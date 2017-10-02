# Learning Solidity by Example

In my limited knowledge of solidity, TDD isn't quite a thing yet in this world,
however, testing is SUPER important for a smart contract, and there are many
lessons to be learned by taking some examples and putting them in a test
harness. While learning any new stack, I find that this is a good approach to
get started.

I've been educating myself on blockchain and in particular ethereum for about
the last three weeks; given that, the purpose of this post is to educate an
experienced programmer on some of the gotcha working with solidty, ethereum and
the truffle framework.

Once I started getting my feet under me I decided to get back to the
documentation on the solidty site and work through some examples there, I picked
the
[Ballot](https://solidity.readthedocs.io/en/develop/solidity-by-example.html#voting)
example contract and decided to get it under some test coverage as a learning
exercise. The example they provide does a nice job of demonstrating some of the
basics of a contract, however left some gaps for me personally that were
actually fun to dig in and figure out.

## Truffle Framework

The [Truffle Framework](http://truffleframework.com/) seems to be as good of a
place as any to get started. You can create a shell project really quickly
utilizing the CLI.  Additionally, it does the hard work of managing your
contracts, tests and migrations all in one place. The documentation is still
pretty young, but they do have some decent tutorials on the site.

The other place that I've been going for ethereum knowledge is a variety of
Udemy classes, which all seam pretty geared around launching an ICO. While
educational, I feel that most of what I'm learning is how to craft a financial
product rather than learning really deeply the underlying tools and language,
but you gotta start somewhere....

Starting with the proposal example on the public site for solidity / ethereum,
lets take that and migrate it to a tested truffle project.

## Data Types in our example contract

When going through the voting exercise, first thing that I noticed were the data
and structures that the language affords us.

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
Pretty much what you see is what you get here, you can create a struct and
assign these attribtues to that and there you have it, data. You can create a
new Voter and access the attributes like so:
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
Fairly straight forward... Also, you'll see a lot of hexadecimal in solidity
development, especially when referencing addresses. (Note the address type above,
that'll be a hex thing)

### Public Attributes

Other items to note in the top of this voter contract, we have created three
public attributes on this contract, chairperson, and proposals. This is where
we'll be storing everything of more or less importance to the contract.
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

### Ballot Constructor

Similar to other languages, the constructor takes arguments and will instantiate
an instance of this contract. New to solidity though, this doesn't just create
an instance in memory, rather it creates a transaction or contract that lives on
the public ethererum blockchain. Also, slightly different from many other
examples out in the ethereurm ecosystem, notice that this constructor takes in
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
* sets the chairperson as the message sender (whoever created this contract)
* loops over the proposal names and adds them to the list of proposals

In the example on the solidity documentation site, they pushed each proposal
into the proposals array directly in the constructor. I abstracted it out to
another function as I wanted to directly test that functionality.

The remainder of the contract is more or less straightforward. There are many
functions in that either modify or access data. Lets dive into the functionality
by writing some tests!

## Getting our project setup

As mentioned above, we'll be using the truffle framework for writing tests
around this contract. Lets create a new truffle project.
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

Now create the Ballot contract in the contracts directory, and paste in the
example code from the solidty documentation. The starting contract is also
available on this repository in case the solidity folks ever remove that
example.

Last, update `migrations/2_deploy_contracts.js` file to only migrate our
contract, and remove any references to the files that we already deleted.

One note, in the migrations file, that is what will be deploying the contract to
the ethereum blockchain. If you want to instantiate the contract with some
default proposals, that is the place. Here is my migration file for example:
```
var Ballot = artifacts.require("./Ballot.sol");

module.exports = function(deployer) {
    deployer.deploy(Ballot, ['example proposal']);
};
```
As you can see, we are creating this Ballot contract here with one proposal:
'example proposal'.

## Tests

Now, create a file in the tests directory for our ballot, here we will only be
writing the mocha / JavaScript tests for now. Solidity apparently is rolling out
its own unit testing utilities, and we'll save exploration there for another
day. Since we are interacting with the contract through the _testrpc_ server,
these tests will act as more or less integration tests against this contract.
There are definitely a few downsides to this method, the primary one for me has
been not having access to the solidity runtime environment makes debugging
fairly difficult. I have gotten the error `invalid opcode` more times than I'd
like to admit, and to me, that's just not a super helpful error message.

The upside for me is that since these contracts do have financial implications,
its nice to have a solid integration test suite around the various ways that the
contract could be used, and it will document nicely how we expect to use the
contract from a web service.

We'll be writing mocha for our tests here, not quite as pretty as rspec if
you're coming from the ruby world, but it does the job. Another funny thing is
that the nature of interacting with these contracts through javascript, more or
less everything returns a promise, so these do get a bit hard to read over time.

Before we get started, you'll need to fire up the testrpc server. Run `testrpc`
from your command line. Now you have a local ethereum blockchain running with 10
example accounts that all hold 100 ethereum a piece for testing purposes.

### Testing our constructor
```javascript
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
});
```
So, the first thing that you should notice is that we're wrapping this testing
environment with the `contract` function. I'm assuming that this is a truffle
specific thing, but the most important piece is the parameter that is passed to
the callback its running: `accounts`. Here is where we'll have access to each of
the test accounts that the testrpc server set up for us.









NOTES
==========================================
What are some initial lessons learned:
* constructor parameters
* how to get the length of an array
* we cannot just print arrays back from the constract to javascript, need
  deliberate accessor methods for the individual entries
* public attributes can be accessed with a call method (promise)
* these tests are hard to read and gross
