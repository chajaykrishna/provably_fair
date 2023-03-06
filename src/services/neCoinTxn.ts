import { Inject, Service } from 'typedi';
import config from '../config';
// import node js crypto module
import crypto from 'crypto';
import _ from 'lodash';

let serverSeed = '1f68dae779a7ae9e3f82105e6cfe44fc1a64404cfe415b32ec31de5e9eaf468c';
let hashedServerSeed = 'NaN';
let previousServerSeed = 'NaN';
let nonce = 0;
const currentRound = 0;
let clientSeed = '';
// 10001 is the total possible outcomes in the predict from 0 to 100 game
const totalPossibleOutcomes = 10001;

@Service()
export default class NeCoinTransactions {
  constructor(@Inject('logger') private logger) {}

  public async generateRandom(): Promise<any> {
    // create a hmac sha256 hash of the server seed.
    const hash = crypto.createHmac('sha256', serverSeed);
    // update client seed and nonce and currentRound
    hash.update(`${clientSeed}:${nonce}:${currentRound}`);
    const hashDigest = hash.digest()
    let index = 0;
    const randomNumbers = [];
    while (index < 32) {
      randomNumbers.push(Number(hashDigest[index]));
      index += 1;
    }
    const floatingPoints = await this.bytesToFloatingPoint(randomNumbers);
    // multiply the floating point by the total possible outcomes
    const finalResult = floatingPoints.map((value) => {
      return value * totalPossibleOutcomes;
    })
    console.log('finalResult: ', finalResult);
    nonce += 1;
    return { finalResult, clientSeed, nonce, hashedServerSeed, previousServerSeed };
  }

  public async bytesToFloatingPoint(bytes: any): Promise<any> {
    // convert bytes to floating point
    console.log('bytes: ', bytes)
    const rand = _.chunk(bytes, 4).map((_chunk) => {
      return _chunk.reduce((result, value, index) => {
        const divider = 256 ** (index + 1);
        const partialResult = Number(value) / divider;
        return Number(result) + partialResult;
      }, 0)
    })
    return rand;
  }

  public async updateClientSeed(_clientSeed: any): Promise<any> {
    clientSeed = _clientSeed;
    nonce = 0;
    previousServerSeed = serverSeed;
    // generate a new server seed
    serverSeed = crypto.randomBytes(32).toString('hex');
    // create a hmac sha256 hash of the server seed.
    hashedServerSeed = crypto.createHmac('sha256', serverSeed).digest().toString('hex');

    console.log('new hashed server seed generated: ', hashedServerSeed);
    return { previousServerSeed, hashedServerSeed, clientSeed, nonce}
  }

  public async 
}
