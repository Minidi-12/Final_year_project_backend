import express from 'express';
import { 
    getallDonations,
    getDonationById,
    createDonation,
    updateDonation,
    deleteDonationById
} from '../application/Donation';

const DonationRouter = express.Router();

DonationRouter
    .route('/')
    .get(getallDonations)
    .post(createDonation);

DonationRouter
    .route('/:id')
    .get(getDonationById)
    .put(updateDonation)
    .delete(deleteDonationById);

export default DonationRouter;