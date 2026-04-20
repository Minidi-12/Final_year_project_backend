import express from 'express';
import {
    getallProjects, 
    getProjectById, 
    createProject, 
    updateProjectStatus, 
    deleteProjectById
} from '../application/Projects';

const projectRouter = express.Router();

projectRouter
    .route('/')
    .get(getallProjects)
    .post(createProject);

projectRouter
    .route('/:id')
    .get(getProjectById)
    .put(updateProjectStatus)
    .delete(deleteProjectById);

export default projectRouter;