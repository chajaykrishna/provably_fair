import { ethers, utils } from 'ethers';
import { abi as neCoinAbi } from '../abi/NeCoin.json';
import { Inject, Service } from 'typedi';
import config from '../config';
import { hexZeroPad } from 'ethers/lib/utils';
const { RpcUrl, NeCoinContract, PLATFORM_WALLET } = process.env;

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
    const lastFetchedBlock = (await provider.getBlockNumber()) - config.blockConfirmations;
    // filter to capture only transfer events and 'to' must be platform wallet
    // events filter
    const eventsFilter = {
      address: NeCoinContract,
      topics: [utils.id('Transfer(address,address,uint256)'), null, hexZeroPad(PLATFORM_WALLET, 32)],
    };
    const events = await NeCoin_Contract.queryFilter(eventsFilter, lastBlock + 1, lastFetchedBlock);
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
