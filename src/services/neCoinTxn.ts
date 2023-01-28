import { ethers } from 'ethers';
import { abi as neCoinAbi } from '../abi/NeCoin.json';
import { Inject, Service } from 'typedi';
import config from '../config';
const { PrivateKey, RpcUrl, NeCoinContract } = process.env;


@Service()
export default class NeCoinTransactions {
  constructor(@Inject('logger') private logger) {}

  public async transferFunds(toAddress: string, amount: string): Promise<any> {
    const provider = new ethers.providers.JsonRpcProvider(RpcUrl);
    const OperatorWallet = new ethers.Wallet(PrivateKey, provider);
    const contract = new ethers.Contract(NeCoinContract, neCoinAbi, OperatorWallet);
    const txn = await contract.transfer(toAddress, ethers.utils.parseEther(amount));
    this.logger.info('Transaction initiated, txnHash: %o', txn.hash);
    const receipt = await txn.wait(config.blockConfirmations);
    this.logger.info(
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
    this.logger.info('transaction confirmed, waiting for txn finality, receipt: %o', receipt);
    await provider.waitForTransaction(txnHash, config.blockConfirmations);
    const transferValue = ethers.utils.formatUnits(receipt.logs[0].data, 18);
    this.logger.info('transaction confirmed by %o blocks, transfer value: %o', receipt.confirmations, transferValue);
    const { from, to, value } = {
      from: receipt.from,
      to: receipt.to,
      value: transferValue,
    };
    return { txnHash, from, to, value };
  }
}
