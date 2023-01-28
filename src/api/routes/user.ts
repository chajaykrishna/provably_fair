import { Router, Response, Request, NextFunction } from 'express';
import { Container } from 'typedi';
import { Logger } from 'winston';
import { celebrate, Joi } from 'celebrate';
import UserData from '../../services/user';

const route = Router();

export default (app: Router) => {
  app.use('/user', route);

  route.post(
    '/userBalance',
    celebrate({
      body: Joi.object({
        address: Joi.string().required(),
      }),
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      const logger: Logger = Container.get('logger');
      logger.info(`fetching user balance for address: ${req.body.address}`);
      try {
        const UserDataInstance = Container.get(UserData);
        const userBalance = await UserDataInstance.userBalance(req.body.address);
        return res.status(200).json({ userBalance });
      } catch (e) {
        logger.error(e);
        return next(e);
      }
    },
  );

  route.post(
    '/blacklistStatus',
    celebrate({
      body: Joi.object({
        address: Joi.string().required(),
      }),
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      const logger: Logger = Container.get('logger');
      logger.info(`fetching user blacklist status: ${req.body.address}`);
      try {
        const UserDataInstance = Container.get(UserData);
        const blacklistStatus = await UserDataInstance.blacklistStatus(req.body.address);
        return res.status(200).json({ blacklistStatus });
      } catch (e) {
        logger.error(e);
        return next(e);
      }
    },
  );

  route.post(
    '/blacklistUser',
    celebrate({
      body: Joi.object({
        address: Joi.string().required(),
      }),
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      const logger: Logger = Container.get('logger');
      logger.info(`blacklisting user: ${req.body.address}`);
      try {
        const UserDataInstance = Container.get(UserData);
        let blacklistStatus = await UserDataInstance.blacklistStatus(req.body.address);
        if (blacklistStatus) {
          logger.error(`user is already blacklisted: ${req.body.address}`);
          return res.status(400).json({ blacklistStatus, message: 'user is already blacklisted' });
        }
        const { txnHash } = await UserDataInstance.blacklistUser(req.body.address);
        blacklistStatus = await UserDataInstance.blacklistStatus(req.body.address);
        logger.info(`user blacklisting done, txnHash: ${txnHash}, blacklistStatus: ${blacklistStatus}`);
        return res.status(200).json({ blacklistStatus, txnHash });
      } catch (e) {
        logger.error(e);
        return next(e);
      }
    },
  );

  route.post(
    '/unBlacklistUser',
    celebrate({
      body: Joi.object({
        address: Joi.string().required(),
      }),
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      const logger: Logger = Container.get('logger');
      logger.info(`blacklisting user: ${req.body.address}`);
      try {
        const UserDataInstance = Container.get(UserData);
        let blacklistStatus = await UserDataInstance.blacklistStatus(req.body.address);
        if (!blacklistStatus) {
          logger.info(`user is not blacklisted: ${req.body.address}`);
          return res.status(400).json({ blacklistStatus, message: 'user is not blacklisted' });
        }
        const { txnHash } = await UserDataInstance.unBlacklistUser(req.body.address);
        blacklistStatus = await UserDataInstance.blacklistStatus(req.body.address);
        logger.info(`user blacklisting done, txnHash: ${txnHash}, blacklistStatus: ${blacklistStatus}`);
        return res.status(200).json({ blacklistStatus, txnHash });
      } catch (e) {
        logger.error(e);
        return next(e);
      }
    },
  );
};
