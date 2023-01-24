import { Container } from 'typedi';
import MailerService from '../services/mailer';
import LoggerInstance from './logger';

export default async (): Promise<any> => {
  try {
    // const privateJWTRS256Key = readFileSync('./keys/jwtRS256.key');
    // const publicJWTRS256Key = readFileSync('./keys/jwtRS256.key.pub');
    // Container.set('privateJWTRS256Key', privateJWTRS256Key);
    // Container.set('publicJWTRS256Key', publicJWTRS256Key);

    // const mailserServiceInstance = new MailerService(LoggerInstance);
    // Container.set('emailClient', mailserServiceInstance);

    Container.set('logger', LoggerInstance);
  } catch (e) {
    LoggerInstance.error('🔥 Error on dependency injector loader: %o', e);
    throw e;
  }
};
