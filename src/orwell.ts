import Api from 'arweave/node/lib/api';
import Utils from './utils';
import { withdrawBalance } from './withdrawal';
import Uploader from './upload';
import Fund from './fund';
import { AxiosResponse } from 'axios';
import { Currency, getCurrencyConfig } from './currencies/matic';
import { providers } from 'ethers';

export let arweave;

export default class Orwell {
  public api: Api;
  public utils: Utils;
  public uploader: Uploader;
  public funder: Fund;
  public address: string;
  public currency: string;
  public currencyConfig: Currency;
  private web3Provider: providers.Web3Provider;

  /**
   * Constructs a new Bundlr instance, as well as supporting subclasses. initialize() needs to be called afterwards
   * @param url - URL to the bundler
   * @param wallet - JWK in JSON
   */
  constructor(
    url: string,
    currency: string,
    web3Provider: providers.Web3Provider,
  ) {
    this.currency = currency;
    this.web3Provider = web3Provider;

    const parsed = new URL(url);
    this.api = new Api({ ...parsed, host: parsed.hostname });

    if (currency !== 'matic') {
      throw new Error(`Unknown/Unsuported currency ${currency}`);
    }
  }

  /**
   * Initializes the library
   */
  async initialize() {
    let signer = await this.web3Provider.getSigner();
    this.address = await signer.getAddress();

    let network = await this.web3Provider.getNetwork();

    if (network.chainId != 137) {
      throw new Error(
        `Unknown/Unsuported network id: ${network.chainId}, please change network to Matic (chain Id: 137)`,
      );
    }

    this.currencyConfig = await getCurrencyConfig(
      this.currency,
      this.web3Provider,
    );

    let mainSigner = await this.currencyConfig.getSigner();

    this.utils = new Utils(
      this.api,
      this.currency,
      this.currencyConfig,
      this.web3Provider,
    );

    this.uploader = new Uploader(this.api, this.currency, mainSigner);
    this.funder = new Fund(this.utils);
  }

  async withdrawBalance(amount) {
    return await withdrawBalance(this.utils, this.api, amount);
  }

  /**
   * Gets the balance for the loaded wallet
   * @returns balance (in winston)
   */
  async getLoadedBalance(): Promise<number> {
    return this.utils.getBalance(this.address);
  }
  /**
   * Gets the balance for the specified address
   * @param address address to query for
   * @returns the balance (in winston)
   */
  async getBalance(address: string): Promise<number> {
    return this.utils.getBalance(address);
  }
  /**
   * Sends amount winston to the specified bundler
   * @param amount amount to send in winston
   * @returns Arweave transaction
   */
  async fund(amount: number, multiplier?: number): Promise<any> {
    return this.funder.fund(amount, multiplier);
  }
  /**
   * Upload a file at the specified path to the bundler
   * @param path path to the file to upload
   * @returns bundler response
   */
  async uploadFile(path: string): Promise<AxiosResponse<any>> {
    return this.uploader.uploadFile(path);
  }

  /**
   * Uploads a random buffer at the specified path to the bundler
   * @param data a Buffer of the data
   * @param tags tags to associate with the data
   * @returns bundler response
   */
  async upload(
    data: Buffer,
    tags: { name: string; value: string }[],
  ): Promise<AxiosResponse<any>> {
    return this.uploader.upload(data, tags);
  }
}
