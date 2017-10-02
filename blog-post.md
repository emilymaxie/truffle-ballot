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

### _structs_

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

###_Public Attributes_

Other items to note in the top of this voter contract, we have created three
public attributes on this contract, chairperson, and proposals. This is where
we'll be storing everything of more or less importance to the contract.
```
address public chairperson;

mapping(address => Voter) public voters;

Proposal[] public proposals;
```
Some notes here:
* _chairperson_ is the address of the owner of the contract
* _voters_ is a mapping of address to Voter structs, so you get a voter by looking
  up their address in that map. If a voter isn't found, it'll return a Voter
  stuct with default empty values.
* _proposals_, not a huge suprise here, an array of the proposals, referenced by
  a integer index





What are some initial lessons learned:
* constructor parameters
* how to get the length of an array
* we cannot just print arrays back from the constract to javascript, need
  deliberate accessor methods for the individual entries
* public attributes can be accessed with a call method (promise)
* these tests are hard to read and gross
