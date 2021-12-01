import Api from 'arweave/node/lib/api';
import { AxiosResponse } from 'axios';
import BigNumber from 'bignumber.js';
import { Currency } from './currencies/matic';
import { providers } from 'ethers';

export default class Utils {
  public api: Api;
  public currency: string;
  public currencyConfig: Currency;
  public web3Provider: providers.Web3Provider;
  constructor(
    api: Api,
    currency: string,
    currencyConfig: Currency,
    web3Provider: providers.Web3Provider,
  ) {
    this.api = api;
    this.currency = currency;
    this.currencyConfig = currencyConfig;
    this.web3Provider = web3Provider;
  }

  /**
   * Throws an error if the provided axios reponse has a status code != 200
   * @param res an axios response
   * @returns nothing if the status code is 200
   */
  public static checkAndThrow(res: AxiosResponse) {
    if (res?.status && res.status != 200) {
      throw new Error(`HTTP Error: ${res.status} ${JSON.stringify(res.data)}`);
    }
    return;
  }

  /**
   * Gets the nonce used for withdrawl request validation from the bundler
   * @returns nonce for the current user
   */
  public async getNonce(): Promise<number> {
    const res = await this.api.get(
      `/account/withdrawals/${this.currency}?address=${await this.web3Provider
        .getSigner()
        .getAddress()}`,
    );
    Utils.checkAndThrow(res);
    return res.data;
  }

  /**
   * Gets the balance on the current bundler for the specified user
   * @param address the user's address to query
   * @returns the balance in winston
   */
  public async getBalance(address: string): Promise<number> {
    const res = await this.api.get(
      `/account/balance/${this.currency}?address=${address}`,
    );
    Utils.checkAndThrow(res);
    return res.data.balance;
  }

  /**
   * Queries the bundler to get it's address for a specific currency
   * @returns the bundler's address
   */
  public async getBundlerAddress(currency: string): Promise<string> {
    const res = await this.api.get('/info');
    Utils.checkAndThrow(res);
    const address = res.data.addresses[currency];
    if (!address) {
      throw new Error(
        `Specified bundler does not support currency ${currency}`,
      );
    }
    return address;
  }

  public async getStorageCost(
    currency: string,
    bytes: number,
  ): Promise<BigNumber> {
    const res = await this.api.get(`/price/${currency}/${bytes}`);
    Utils.checkAndThrow(res);
    return new BigNumber(res.data);
  }
}
