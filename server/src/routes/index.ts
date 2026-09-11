import { Router } from 'express';
import healthRoutes from './health.routes.js';
import advisoryRoutes from './advisory.routes.js';
import fertilizersRoutes from './fertilizers.routes.js';
import cropHealthGovRoutes from './cropHealthGov.routes.js';

const apiRouter = Router();

apiRouter.use('/health', healthRoutes);
apiRouter.use('/advisories', advisoryRoutes);
apiRouter.use('/advisory', advisoryRoutes);
apiRouter.use('/fertilizers', fertilizersRoutes);
apiRouter.use('/crop-health-data', cropHealthGovRoutes);

export default apiRouter;
