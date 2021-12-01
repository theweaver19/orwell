# Orwell Polygon To Bundlr Client

This library allows Polygon users to upload seamlessly to Arweave via the Bundlr Network.
This means you can upload data permanently to Arweave using you Polygon (MATIC) balance

## Create a new Orwell instance

The Orwell library accepts any type of Web3Provider. Below is an example using WalletConnect

```ts
import Orwell from 'src/index';

let node = 'https://node2.bundlr.network/';
let walletConnector = new WalletConnectProvider({
  bridge: 'https://bridge.walletconnect.org', // Required
  qrcodeModal: QRCodeModal,
  rpc: {
    137: 'https://polygon-rpc.com',
  },
});

await walletConnector.enable();

const web3Provider = new ethers.providers.Web3Provider(walletConnector);

let orwell = new Orwell(node, 'matic', web3Provider);

await orwell.initialize();
```

### Get the account's balance with the current bundler

```ts
await orwell.getLoadedBalance(); // 109864
```

### Get the balance of an arbitrary address with the current bundler

```ts
await orwell.getBalance(address); // 10000
```

### Fund a bundler

```ts
await orwell.fund(amount);
```

An amount of 1 is 10^-18 MATIC

### Request a withdrawal from the bundler

```ts
let response = await orwell.withdrawBalance(amount);

// withdrawl request status
response.status; // http status code

// 400 - something went wrong
response.data = 'Not enough balance for requested withdrawl';

// 200 - Ok
response.data = {
  requested, // the requested amount,
  fee, // the reward required by the network (network fee)
  final, // the amount you will receive (requested - fee)
  tx_id, // the Arweave ID of the withdrawl transaction
};
```

### Upload a file to the bundler

```ts
await orwell.uploadFile('./<FILE>.<EXTENSION');
```

### Upload any buffer to the bundler

```ts
let res = await orwell.upload(Buffer.from('test'), [
  {
    name: 'Content-Type',
    value: 'application/json',
  },
  {
    name: 'app',
    value: 'Orwell-Demo',
  },
]);
```
