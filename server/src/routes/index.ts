import { Router } from 'express';
import healthRoutes from './health.routes.js';
import advisoryRoutes from './advisory.routes.js';
import fertilizersRoutes from './fertilizers.routes.js';

const apiRouter = Router();

apiRouter.use('/health', healthRoutes);
apiRouter.use('/advisories', advisoryRoutes);
apiRouter.use('/advisory', advisoryRoutes);
apiRouter.use('/fertilizers', fertilizersRoutes);

export default apiRouter;
