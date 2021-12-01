import Orwell from '../src/index';
import QRCodeModal from '@walletconnect/qrcode-modal';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { ethers } from 'ethers';

async function a() {
  try {
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

    console.log(`Connected to node ${node} with address ${orwell.address}`);

    console.log(`Your balance is ${await orwell.getBalance(orwell.address)}`);

    // console.log(await orwell.fund(100000000000000000));

    // console.log(await orwell.withdrawBalance(101));
  } catch (e) {
    console.log(e);
  }
}
a();
