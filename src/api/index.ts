import { Router } from 'express';
import neCoinTxn from './routes/neCoinTxn';
import transferEvents from './routes/transferEvents';
import user from './routes/user';

// guaranteed to get dependencies
export default () => {
  const app = Router();
  neCoinTxn(app);
  transferEvents(app);
  user(app);

  return app;
};
