# react-multisend

[![Build Status](https://github.com/gnosis/react-multisend/actions/workflows/ci.yml/badge.svg)](https://github.com/gnosis/react-multisend/actions/workflows/ci.yml)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](https://github.com/gnosis/CODE_OF_CONDUCT)

A headless React library for crafting multi-send transactions from a Gnosis Safe

## The problem

DAO governance proposals typically include a set of transactions, which can be encoded into a single multi-send transaction for execution from the DAO's Gnosis Safe when the vote passes.
On the user interface level, this requires components for creating and displaying batches of arbitrary transactions in an easy and understandable way.

## This solution

This library offers a set of hooks and utility functions for building React components that allow users to craft transactions for execution from a Gnosis Safe:

- [useSafeBalances](#useSafeBalances) for listing a Gnosis Safe's ETH and ERC20 balances
- [useSafeCollectibles](#useSafeCollectibles) for listing a Gnosis Safe's NFT holdings
- [useContractCall](#useContractCall) for querying contract ABIs and managing input values for contract function calls
- [encodeMulti](#encodeMulti) for encoding a set of transactions into a multi-send transaction batch

Rather than offering ready-to-use UI components, react-multisend is a toolkit of primitives enabling developers of DAO tools to build user interfaces using their own UX patterns and design system components.

## Docs & example application

For examples on how to use the hooks, check out our [documentation](https://gnosis.github.io/react-multisend/).
These example components are a good starting point for creating your own components.

## Installation

This module is distributed via npm. For adding it to your project, run:

```
npm install --save react-multisend
```

To install it using yarn, run:

```
yarn add react-multisend
```

This package also depends on `react`. Please make sure you have it installed as well.
