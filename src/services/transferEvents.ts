import { ethers } from 'ethers';
import { abi as neCoinAbi } from '../abi/NeCoin.json';
import { Inject, Service } from 'typedi';
import config from '../config';
const { RpcUrl, NeCoinContract } = process.env;

@Service()
export default class FetchTransfers {
  constructor(@Inject('logger') private logger) {}

  /**
   * @dev have to handle a situation where the events to fetch are more than 5k i.e more than the alchemy limit
   * @info using 50 block confirmations for transaction finality.
   * */
  public async fetchEvents(lastBlock: number): Promise<any> {
    const provider = new ethers.providers.JsonRpcProvider(RpcUrl);
    const NeCoin_Contract = new ethers.Contract(NeCoinContract, neCoinAbi, provider);
    const lastFetchedBlock = (await provider.getBlockNumber()) - config.blockConfirmations;
    // filter to capture only transfer events and to must be platform wallet
    const events = await NeCoin_Contract.queryFilter(
      'Transfer(address,address,uint256)',
      lastBlock + 1,
      lastFetchedBlock,
    );
    if (!(events.length == 0)) {
      this.logger.info(`captured ${events.length} events, last fetched block: ${lastFetchedBlock}`);
      const transferEvents = events.map((event) => {
        return {
          txnHash: event.transactionHash,
          from: event.args.from,
          to: event.args.to,
          value: ethers.utils.formatUnits(event.args.value.toString(), 18),
          blockNumber: event.blockNumber,
        };
      });
      this.logger.info(transferEvents);
      return { transferEvents: transferEvents, lastFetchedBlock: lastFetchedBlock };
    } else {
      this.logger.info('no new events to fetch, last fetched block: %o', lastFetchedBlock);
      return { transferEvents: [], lastFetchedBlock: lastFetchedBlock };
    }
  }
}
