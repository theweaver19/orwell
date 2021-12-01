import redstone from 'redstone-api';
import BigNumber from 'bignumber.js';
import base64url from 'base64url';
import Arweave from 'arweave';
import { FileDataItem } from 'arbundles/file';
import keccak256 from 'keccak256';
import { providers, ethers } from 'ethers';
import { Signer } from 'arbundles/build/signing';
import Utils from '../utils';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore

export interface Tx {
  from: string;
  to: string;
  amount: BigNumber;
  blockHeight?: BigNumber;
  pending: boolean;
  confirmed: boolean;
}

export interface CreateTxData {
  amount: BigNumber | number;
  to: string;
  fee?: string;
}

export interface Currency {
  base: [string, number];
  web3Provider: providers.Web3Provider;
  account: { address: string };
  publicKey: Buffer;

  getId(item: FileDataItem): Promise<string>;

  price(): Promise<number>;

  sign(data: Uint8Array): Promise<Uint8Array>;

  getSigner(): Promise<Signer>;

  getFee(amount: BigNumber | number, to?: string): Promise<BigNumber>;

  createTx(
    amount: BigNumber | number,
    to: string,
    fee?: string,
  ): Promise<{ txId: string; tx: any }>;

  getPublicKey(): string | Buffer;
}

export async function getCurrencyConfig(
  currency: string,
  web3Provider: providers.Web3Provider,
): Promise<Currency> {
  if (currency === 'matic') {
    let matic = new CurrencyMatic(web3Provider);
    await matic.initialize();

    return {
      base: ['wei', 1e18],
      web3Provider: web3Provider,
      publicKey: matic.publicKey,
      account: {
        address: await web3Provider.getSigner().getAddress(),
      },
      getId: async (item) => {
        return base64url.encode(
          Buffer.from(await Arweave.crypto.hash(await item.rawSignature())),
        );
      },
      price: () => matic.getRedstonePrice('MATIC'),
      sign: matic.sign,
      getSigner: async () => {
        return matic;
      },
      getFee: matic.maticGetFee,
      createTx: matic.maticCreateTx,
      getPublicKey: matic.maticGetPublicKey,
    };
  } else {
    throw new Error('Currency not supported');
  }
}

export class CurrencyMatic {
  private web3Provider: providers.Web3Provider;

  publicKey: Buffer;
  readonly signatureType = 3;
  readonly signatureLength = 65;
  readonly ownerLength = 65;

  constructor(web3Provider: providers.Web3Provider) {
    this.web3Provider = web3Provider;
  }

  async initialize() {
    const msg =
      'In order to recover your public key, please sign this message. This is a safe operation.';
    let signer = this.web3Provider.getSigner();
    let sig = await signer.signMessage(msg);
    const msgHash = ethers.utils.hashMessage(msg);
    const msgHashBytes = ethers.utils.arrayify(msgHash);

    const pk = ethers.utils.recoverPublicKey(msgHashBytes, sig);

    this.publicKey = Buffer.from(pk.substring(2), 'hex');
  }

  async sign(message: Uint8Array): Promise<Uint8Array> {
    let signer = await this.web3Provider.getSigner();

    let sigStr = await signer.signMessage(message);

    return Buffer.from(sigStr.slice(2), 'hex');
  }

  maticOwnerToAddress(owner: Uint8Array): string {
    return '0x' + keccak256(owner.slice(1)).slice(-20).toString('hex');
  }

  async maticGetTx(txId: string): Promise<Tx> {
    const response = await this.web3Provider.getTransaction(txId);

    if (!response) throw new Error("Tx doesn't exist");

    return {
      from: response.from,
      to: response.to,
      blockHeight: new BigNumber(response.blockNumber),
      amount: new BigNumber(response.value.toHexString(), 16),
      pending: !response.blockHash,
      confirmed: response.confirmations >= 10,
    };
  }

  async maticGetHeight(): Promise<BigNumber> {
    const response = await this.web3Provider.send('eth_blockNumber', []);

    return new BigNumber(response, 16);
  }

  async maticGetFee(amount: BigNumber, to: string): Promise<BigNumber> {
    await this.web3Provider.ready;

    const tx = {
      to,
      value: '0x' + amount.toString(16),
    };

    const estimatedGas = await this.web3Provider.estimateGas(tx);
    const gasPrice = await this.web3Provider.getGasPrice();

    return new BigNumber(estimatedGas.mul(gasPrice).toString());
  }

  // this creates and sends a transaction
  async maticCreateTx(amount, to, _fee?): Promise<any> {
    await this.web3Provider.ready;

    let bigNumberAmount: BigNumber;
    if (BigNumber.isBigNumber(amount)) {
      bigNumberAmount = amount;
    } else {
      bigNumberAmount = new BigNumber(amount);
    }
    const _amount = '0x' + bigNumberAmount.toString(16);

    const estimatedGas = await this.web3Provider.estimateGas({
      to,
      value: _amount,
    });
    const gasPrice = await this.web3Provider.getGasPrice();

    let signer = await this.web3Provider.getSigner();

    const tx = await signer.populateTransaction({
      to,
      value: _amount,
      gasPrice,
      gasLimit: estimatedGas,
    });

    let sentTx = null;
    try {
      sentTx = await signer.sendTransaction(tx);
    } catch (e) {
      console.error(`Error occurred while sending a MATIC tx - ${e}`);
      throw e;
    }

    Utils.checkAndThrow(sentTx);

    return { txId: sentTx.hash, tx: sentTx };
  }

  maticGetPublicKey(): Buffer {
    return this.publicKey;
  }

  async getRedstonePrice(currency: string): Promise<number> {
    return (await redstone.getPrice(currency)).value;
  }
}
