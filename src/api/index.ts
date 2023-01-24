import { Router } from 'express';
import neCoinTxn from './routes/neCoinTxn';
import transferEvents from './routes/transferEvents';

// guaranteed to get dependencies
export default () => {
  const app = Router();
  neCoinTxn(app);
  transferEvents(app);


  return app;
};
