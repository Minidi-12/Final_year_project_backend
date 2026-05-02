import express from 'express';
import {
    getallVolunteers, 
    getVolunteerById, 
    createVolunteer, 
    updateVolunteer, 
    deleteVolunteerById,
    getVolunteerRecommendations,
    previewMatchingProjects,
    runMLMatching
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

// ML Matching routes
volunteerRouter
    .route('/:id/recommendations')
    .get(getVolunteerRecommendations);

volunteerRouter
    .route('/match/preview')
    .post(previewMatchingProjects);

volunteerRouter
    .route('/match/run')
    .post(runMLMatching);

export default volunteerRouter;