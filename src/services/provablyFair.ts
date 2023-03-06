import { Inject, Service } from 'typedi';
import config from '../config';

@Service()
export default class ProvablyFair {
  constructor(@Inject('logger') private logger) {}

  public async getRandom(clientSeed: string): Promise<any> {
    const randomNum = 6;
    return randomNum;
  }
}