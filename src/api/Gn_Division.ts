import express from 'express';
import { 
    getAllGn_Divisions,
    getGn_DivisionById,
    createGn_Division,
    updateGn_Division,
    deleteGn_DivisionById
} from '../application/Gn_Division';

const Gn_DivisionRouter = express.Router();

Gn_DivisionRouter
    .route('/')
    .get(getAllGn_Divisions)
    .post(createGn_Division);

Gn_DivisionRouter
    .route('/:id')
    .get(getGn_DivisionById)
    .put(updateGn_Division)
    .delete(deleteGn_DivisionById);

export default Gn_DivisionRouter;