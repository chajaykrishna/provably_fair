import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { abi as neCoinAbi } from '../abi/NeCoin.json';
import Logger from '../loaders/logger';
import { Container, Inject, Service } from 'typedi';
const { PrivateKey, RpcUrl, NeCoinContract } = process.env;

@Service()
export default class FetchTransfers {
  constructor(@Inject('logger') private logger) {}

  /**
   * @dev have to handle the where the events to fetch are more than 5k i.e more than the alchemy limit
   * @info we are waiting for 50 blocks to be mined before fetching the events
   * */
  public async fetchEvents(lastBlock: number): Promise<any> {
    const provider = new ethers.providers.JsonRpcProvider(RpcUrl);
    const NeCoin_Contract = new ethers.Contract(NeCoinContract, neCoinAbi, provider);
    const lastFetchedBlock = (await provider.getBlockNumber()) - 50;
    const events = await NeCoin_Contract.queryFilter(
      'Transfer(address,address,uint256)',
      lastBlock + 1,
      lastFetchedBlock,
    );
    console.log(lastFetchedBlock);
    if (!(events.length == 0)) {
      Logger.info(`captured ${events.length} events, last fetched block: ${lastFetchedBlock}`);
      const transferEvents = events.map((event) => {
        return {
          txnHash: event.transactionHash,
          from: event.args.from,
          to: event.args.to,
          value: ethers.utils.formatUnits(event.args.value.toString(), 18),
          blockNumber: event.blockNumber,
        };
      });
      Logger.info(transferEvents);
      return { transferEvents: transferEvents, lastFetchedBlock: lastFetchedBlock };
    } else {
      Logger.info('no new events to fetch, last fetched block: %o', lastFetchedBlock);
      return { transferEvents: [], lastFetchedBlock: lastFetchedBlock };
    }
  }
}
