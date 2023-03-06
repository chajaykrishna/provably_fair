import { Router, Response, Request, NextFunction } from 'express';
import { Container } from 'typedi';
import { Logger } from 'winston';
import { celebrate, Joi } from 'celebrate';
import ProvablyFair from '../../services/provablyFair';

const route = Router();

export default (app: Router) => {
  app.use('/cryptography', route);

  route.post(
    '/provablyFair',
    celebrate({
      body: Joi.object({
        clientSeed: Joi.string().required()
      }),
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      const res1 = 6;
      return res.status(200).json({ res1 });
      const logger: Logger = Container.get('logger');
      logger.info(`getting random number: ${req.body.clientSeed}`);
      console.log(' entered ');
      try {
        const provablyFairInstance = Container.get(ProvablyFair);
        const result = await provablyFairInstance.getRandom(req.body.clientSeed);
        return res.status(200).json({ result });
      } catch (e) {
        logger.error(e);
        return next(e);
      }
    },
  );
};