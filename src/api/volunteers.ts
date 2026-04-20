import express from 'express';
import {
    getallVolunteers, 
    getVolunteerById, 
    createVolunteer, 
    updateVolunteer, 
    deleteVolunteerById 
} from '../application/volunteers';

const volunteerRouter = express.Router();

volunteerRouter
    .route('/')
    .get(getallVolunteers)
    .post(createVolunteer);

volunteerRouter
    .route('/:id')
    .get(getVolunteerById)
    .put(updateVolunteer)
    .delete(deleteVolunteerById);

export default volunteerRouter;