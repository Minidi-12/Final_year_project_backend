import express from 'express';
import { 
    getallB_Reqs, 
    getB_ReqById, 
    createB_Req, 
    updateB_Req, 
    deleteB_ReqbyId
} from '../application/B_Req';

const B_ReqRouter = express.Router();

B_ReqRouter
    .route('/')
    .get(getallB_Reqs)
    .post(createB_Req);

B_ReqRouter
    .route('/:id')
    .get(getB_ReqById)
    .put(updateB_Req)
    .delete(deleteB_ReqbyId);

export default B_ReqRouter;