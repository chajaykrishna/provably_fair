import { Router, Response, Request, NextFunction } from 'express';
import { Container } from 'typedi';
import { Logger } from 'winston';
import { celebrate, Joi } from 'celebrate';
import NeCoinTransactions from '../../services/neCoinTxn';

const route = Router();

export default (app: Router) => {
  app.use('/neCoinTxn', route);

  route.post(
    '/sendNeCoins',
    celebrate({
      body: Joi.object({
        address: Joi.string().required(),
        amount: Joi.string().required(),
      }),
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      const logger: Logger = Container.get('logger');
      logger.debug('Calling sendNeCoin endpoint with body: %o', req.body);
      try {
        // convert amount to wei
        const NeCoinAmount = req.body.amount;
        const NeCoinTxnInstance = Container.get(NeCoinTransactions);
        const { txnHash, from, to } = await NeCoinTxnInstance.transferFunds(req.body.address, NeCoinAmount);
        return res.status(200).json({ txnHash, from, to, NeCoinAmount });
      } catch (e) {
        logger.error(e);
        return next(e);
      }
    },
  );

  route.post(
    '/validateTxn',
    celebrate({
      body: Joi.object({
        txnHash: Joi.string().required(),
      }),
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      const logger: Logger = Container.get('logger');
      logger.debug('Calling validateNeCoinTransfer endpoint with body: %o', req.body);
      try {
        // convert amount to wei
        const NeCoinTxnInstance = Container.get(NeCoinTransactions);
        const { txnHash, from, to, value } = await NeCoinTxnInstance.validateTxn(req.body.txnHash);
        return res.status(200).json({ txnHash, from, to, value });
      } catch (e) {
        logger.error(e);
        return next(e);
      }
    },
  );
};
