import express from 'express';
import { 
    createNews_post,
    getallNews_posts,
    getNews_postById,
    updateNews_post,
    deleteNews_postById
} from '../application/News_post';

const News_postRouter = express.Router();

News_postRouter
    .route('/')
    .get(getallNews_posts)
    .post(createNews_post);

News_postRouter
    .route('/:id')
    .get(getNews_postById)
    .put(updateNews_post)
    .delete(deleteNews_postById);

export default News_postRouter;