import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { abi as neCoinAbi } from '../abi/NeCoin.json';
import Logger from '../loaders/logger';
import { Container, Inject, Service } from 'typedi';
const { PrivateKey, RpcUrl, NeCoinContract } = process.env;

@Service()
export default class NeCoinTransactions {
  constructor(@Inject('logger') private logger) {}

  public async transferFunds(toAddress: string, amount: string): Promise<any> {
    const provider = new ethers.providers.JsonRpcProvider(RpcUrl);
    const OperatorWallet = new ethers.Wallet(PrivateKey, provider);
    const contract = new ethers.Contract(NeCoinContract, neCoinAbi, OperatorWallet);
    const txn = await contract.transfer(toAddress, ethers.utils.parseEther(amount));
    Logger.info('Transaction initiated, txnHash: %o', txn.hash);
    const receipt = await txn.wait();
    Logger.info(
      'Transaction finality reached, hash: %o, block confirmations: %o, neCoins transferred: %o',
      receipt.transactionHash,
      receipt.confirmations,
      ethers.utils.formatUnits(receipt.logs[0].data, 18),
    );
    const { txnHash, from, to } = {
      txnHash: receipt.transactionHash,
      from: receipt.from,
      to: receipt.to,
    };
    return { txnHash, from, to };
  }

  public async validateTxn(txnHash: string): Promise<any> {
    const provider = new ethers.providers.JsonRpcProvider(RpcUrl);
    const txn = await provider.getTransaction(txnHash);
    // wait for the transaction to be mined
    const receipt = await txn.wait();
    Logger.info('transaction confirmed, waiting for txn finality, receipt: %o', receipt);
    await provider.waitForTransaction(txnHash, 50);
    const transferValue = ethers.utils.formatUnits(receipt.logs[0].data, 18);
    Logger.info('transaction confirmed by %o blocks, transfer value: %o', receipt.confirmations, transferValue);
    const { from, to, value } = {
      from: receipt.from,
      to: receipt.to,
      value: transferValue,
    };
    return { txnHash, from, to, value };
  }

  public async FetchTransfers(lastBlock: number): Promise<any> {
    try {
      const provider = new ethers.providers.JsonRpcProvider(RpcUrl);
      const NeCoin_Contract = new ethers.Contract(NeCoinContract, neCoinAbi, provider);
      // const filter = NeCoin_Contract.filters.Transfer(null, null, null);
      const events = await NeCoin_Contract.queryFilter('Transfer(address,address,uint256)', lastBlock + 1, 'latest');
      if (!(events.length == 0)) {
        console.log(`captured ${events.length} events`);
        lastBlock = events[events.length - 1].blockNumber;
        events.forEach((event) => {
          console.log(
            event.blockNumber,
            event.transactionHash,
            event.args.from,
            event.args.to,
            event.args.value.toString(),
          );
        });
        // return  a json object of the events
        //   const txnEvents = events.map((event) => {
        //     txnHash = event.transactionHash;
        //     from = event.args.from;
        //     to = event.args.to;
        //     value = event.args.value.toString();
        //     blockNumber = event.blockNumber;
        //     return { txnHash, from, to, value, blockNumber };
        //   });
      } else {
        console.log('no new events');
      }
    } catch (err) {
      console.log(err);
    }
  }
}
