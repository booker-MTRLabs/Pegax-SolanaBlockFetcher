# Pegax-SolanaBlockFetcher

## Project Overview

Pegax-SolanaBlockFetcher is a tool for fetching and processing block data from the Solana blockchain.

## Install Dependencies

Before using the project, make sure all dependencies are installed. You can install them using the following command:

```sh
npm install
```

## Configure Environment Variables
Create a .env file in the root directory of the project

## Usage
### 1. Run gRPC Client Example

```sh
ts-node src/grpc/example/GrpcClientExample.ts
```

### 2. Run gRPC Monitor

```sh
ts-node src/grpc/index.ts
```

### 2. Run RPC Fetcher

```sh
ts-node src/rpc/index.ts
```