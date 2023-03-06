import { Router } from 'express';
import neCoinTxn from './routes/neCoinTxn';

// guaranteed to get dependencies
export default () => {
  const app = Router();
  neCoinTxn(app);
  return app;
};
