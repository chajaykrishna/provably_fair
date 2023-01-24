import { Router, Response, Request, NextFunction } from 'express';
import { Container } from 'typedi';
import { Logger } from 'winston';
import { celebrate, Joi } from 'celebrate';
import FetchTransfers from '../../services/transferEvents';
const { PLATFORM_WALLET } = process.env;

const route = Router();

export default (app: Router) => {
  app.use('/events', route);

  route.post(
    '/fetchNeCoinTransfers',
    celebrate({
      body: Joi.object({
        lastFetchedBlock: Joi.number().required(),
      }),
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      const logger: Logger = Container.get('logger');
      logger.debug('Calling fetchNeCoinTransfers endpoint with body: %o', req.body);
      try {
        const FetchTransfersInstance = Container.get(FetchTransfers);
        const { transferEvents, lastFetchedBlock } = await FetchTransfersInstance.fetchEvents(
          req.body.lastFetchedBlock,
        );
        const filteredTransferEvents = transferEvents.filter((transferEvent) => transferEvent.to === PLATFORM_WALLET);
        return res.status(200).json({ filteredTransferEvents, lastFetchedBlock });
      } catch (e) {
        logger.error(e);
        return next(e);
      }
    },
  );
};
