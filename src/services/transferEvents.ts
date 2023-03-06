import { ethers, utils } from 'ethers';
import { Network, Alchemy } from 'alchemy-sdk';
import { abi as neCoinAbi } from '../abi/NeCoin.json';
import { Inject, Service } from 'typedi';
import config from '../config';
import { hexZeroPad } from 'ethers/lib/utils';
const { RpcUrl, NeCoinContract, PLATFORM_WALLET, ALCHEMY_API } = process.env;

@Service()
export default class FetchTransfers {
  constructor(@Inject('logger') private logger) {}

  /**
   * @dev have to handle the scenario where the events to fetch are more than 5k i.e more than the alchemy limit
   * @info we are waiting for 50 blocks to be mined before fetching the events
   * */
  public async fetchEvents(lastBlock: number): Promise<any> {

    const settings = {
      apiKey: ALCHEMY_API, // Replace with your Alchemy API Key.
      network: Network.MATIC_MUMBAI, // Replace with your network.
    };
    const alchemy = new Alchemy(settings);

    const provider = new ethers.providers.JsonRpcProvider(RpcUrl);
    const NeCoin_Contract = new ethers.Contract(NeCoinContract, neCoinAbi, provider);
    const lastBlockToFetch = (await provider.getBlockNumber()) - config.blockConfirmations;
    
    const eventsFilter = {
      address: NeCoinContract,
      topics: [utils.id('Transfer(address,address,uint256)'), null, hexZeroPad(PLATFORM_WALLET, 32)],
    };

    const events = [];
    if (lastBlockToFetch - lastBlock > config.blockRange) {
      let startBlock = lastBlock + 1;

      const promises = [];
      while (startBlock < lastBlockToFetch) {
        const endBlock = startBlock + config.blockRange;
        promises.push(alchemy.core.getLogs({ ...eventsFilter, fromBlock: startBlock, toBlock: endBlock }));
        startBlock = endBlock + 1;
      }
      const eventsBatches = await Promise.all(promises);
      eventsBatches.forEach((eventsBatch) => {
        events.push(...eventsBatch);
      });

      // while (startBlock < lastBlockToFetch) {
      //   const endBlock = startBlock + 60000;
      //   promises.push(NeCoin_Contract.queryFilter(eventsFilter, startBlock, endBlock));
      //   startBlock = endBlock + 1;
      // }
      // const eventsBatches = await Promise.all(promises);
      // eventsBatches.forEach((eventsBatch) => {
      //   events.push(...eventsBatch);
      // });

    } else {
      const eventsBatch = await alchemy.core.getLogs({
        ...eventsFilter,
        fromBlock: lastBlock + 1,
        toBlock: lastBlockToFetch,
      });
      events.push(...eventsBatch);
    }

    // const events = await NeCoin_Contract.queryFilter(eventsFilter, lastBlock + 1, lastFetchedBlock);
    if (!(events.length == 0)) {
      this.logger.info(`captured ${events.length} events, last fetched block: ${lastBlockToFetch}`);
      const transferEvents = events.map((event) => {
        return {
          txnHash: event.transactionHash,
          from: event.topics[1],
          to: event.topics[2],
          value: ethers.utils.formatUnits(event.data.toString(), 18),
          blockNumber: event.blockNumber,
        };
      });
      this.logger.info(transferEvents);
      return { transferEvents: transferEvents, lastFetchedBlock: lastBlockToFetch };
    } else {
      this.logger.info('no new events to fetch, last fetched block: %o', lastBlockToFetch);
      return { transferEvents: [], lastFetchedBlock: lastBlockToFetch };
    }
  }
}
