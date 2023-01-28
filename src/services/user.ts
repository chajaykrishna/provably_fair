import { ethers, logger } from 'ethers';
import { abi as neCoinAbi } from '../abi/NeCoin.json';
import { Inject, Service } from 'typedi';
import config from '../config';
const { PrivateKey, RpcUrl, NeCoinContract } = process.env;

@Service()
export default class UserData {
  constructor(@Inject('logger') private logger) {}

  public async userBalance(address: string) {
    const provider = new ethers.providers.JsonRpcProvider(RpcUrl);
    const NeCoin_Contract = new ethers.Contract(NeCoinContract, neCoinAbi, provider);
    const balance = await NeCoin_Contract.balanceOf(address);
    const balanceInNeCoins = ethers.utils.formatUnits(balance.toString(), 18);
    return balanceInNeCoins;
  }

  public async blacklistStatus(address: string) {
    const provider = new ethers.providers.JsonRpcProvider(RpcUrl);
    const NeCoin_Contract = new ethers.Contract(NeCoinContract, neCoinAbi, provider);
    const status = await NeCoin_Contract.blackList(address);
    return status;
  }

  public async blacklistUser(address: string) {
    const provider = new ethers.providers.JsonRpcProvider(RpcUrl);
    const OperatorWallet = new ethers.Wallet(PrivateKey, provider);
    const NeCoin_Contract = new ethers.Contract(NeCoinContract, neCoinAbi, OperatorWallet);
    const txn = await NeCoin_Contract.addToBlackList(address);
    logger.info('Blacklisting initiated, txnHash: %o', txn.hash);
    const receipt = await txn.wait(config.blockConfirmations);
    this.logger.info(
      'Blacklisting finality reached, hash: %o, block confirmations: %o',
      receipt.transactionHash,
      receipt.confirmations,
    );
    const { txnHash } = {
      txnHash: receipt.transactionHash,
    };
    return { txnHash };
  }

  public async unBlacklistUser(address: string) {
    const provider = new ethers.providers.JsonRpcProvider(RpcUrl);
    const OperatorWallet = new ethers.Wallet(PrivateKey, provider);
    const NeCoin_Contract = new ethers.Contract(NeCoinContract, neCoinAbi, OperatorWallet);
    const txn = await NeCoin_Contract.removeFromBlackList(address);
    logger.info('Unblacklisting initiated, txnHash: %o', txn.hash);
    const receipt = await txn.wait(config.blockConfirmations);
    this.logger.info(
      'Unblacklisting finality reached, hash: %o, block confirmations: %o',
      receipt.transactionHash,
      receipt.confirmations,
    );
    const { txnHash } = {
      txnHash: receipt.transactionHash,
    };
    return { txnHash };
  }
}
