import express from 'express';

import ItemController from './controllers/ItemController';
import PointsController from './controllers/PointsController';

const routes = express.Router();

const itemController = new ItemController();
const pointsController = new PointsController();

routes.get("/items", itemController.index);

routes.post("/points", pointsController.create)

routes.get("/points", pointsController.index);
routes.get("/points/:id", pointsController.show);

export default routes;