import express from 'express';
import {
  getAllGn_Officers,
  getGn_OfficerById,
  createGn_Officer,
  updateGn_Officer,
  deleteGn_OfficerById,
} from '../application/Gnofficer';

const GnofficerRouter = express.Router();

GnofficerRouter
    .route('/')
    .get(getAllGn_Officers)
    .post(createGn_Officer);

GnofficerRouter
    .route('/:id')
    .get(getGn_OfficerById)
    .put(updateGn_Officer)
    .delete(deleteGn_OfficerById);

export default GnofficerRouter;