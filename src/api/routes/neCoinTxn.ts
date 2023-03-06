import { Router, Response, Request, NextFunction } from 'express';
import { Container } from 'typedi';
import { Logger } from 'winston';
import { celebrate, Joi } from 'celebrate';
import NeCoinTransactions from '../../services/neCoinTxn';

const route = Router();

export default (app: Router) => {
  app.use('/randomNumber', route);

  route.post(
    '/getRandom',
    celebrate({
      body: Joi.object({
        clientSeed: Joi.string().required(),
      }),
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      const logger: Logger = Container.get('logger');
      logger.debug('Calling generateRandom endpoint with body: %o', req.body);
      try {
        // convert amount to wei
        const NeCoinTxnInstance = Container.get(NeCoinTransactions);
        const random = await NeCoinTxnInstance.generateRandom();
        logger.info('random number generated: ', random);
        return res.status(200).json({ random });
      } catch (e) {
        logger.error(e);
        return next(e);
      }
    },
  );

  route.post(
    '/updateClientSeed',
    celebrate({
      body: Joi.object({
        newClientSeed: Joi.string().required(),
      }),
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      const logger: Logger = Container.get('logger');
      logger.debug('Calling generateRandom endpoint with body: %o', req.body);
      try {
        // convert amount to wei
        const NeCoinTxnInstance = Container.get(NeCoinTransactions);
        const newServerSeed = await NeCoinTxnInstance.updateClientSeed(req.body.newClientSeed);
        return res.status(200).json({ newServerSeed });
      } catch (e) {
        logger.error(e);
        return next(e);
      }
    },
  );

};
