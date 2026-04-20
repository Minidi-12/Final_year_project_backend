import { Request, Response, NextFunction } from "express";
import News_postdto from "../domain/dto/News_postdto";
import ValidationError from "../domain/errors/validation-error";
import NotFoundError from "../domain/errors/not-found-error";
import News_post from "../infrastructure/db/entities/News_post";

const createNews_post = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { author_name, title, content, image_url, category } = req.body;
    const news_post = await News_post.create({
      author_name,
      title,
      content,
      image_url,
      category
    });
    res.status(201).json(news_post);
  } catch (error) {
    next(error);
  }
};

const getallNews_posts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const news_posts = await News_post.find();
    res.status(200).json(news_posts);
  } catch (error) {
    next(error);
  }
};

const getNews_postById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const news_post = await News_post.findById(req.params.id);
    if (!news_post) {
      throw new NotFoundError("News post not found");
    }
    res.status(200).json(news_post);
  } catch (error) {
    next(error);
  }
};

const updateNews_post = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { author_name, title, content, image_url, category } = req.body;
    const news_post = await News_post.findByIdAndUpdate(
      req.params.id,
      { author_name, title, content, image_url, category },
      { new: true }
    );
    if (!news_post) {
      throw new NotFoundError("News post not found");
    }
    res.status(200).json(news_post);
  } catch (error) {
    next(error);
  }
};

const deleteNews_postById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const news_post = await News_post.findByIdAndDelete(req.params.id);
    if (!news_post) {
      throw new NotFoundError("News post not found");
    }
    res.status(200).json({ message: "News post deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export {
  createNews_post,
  getallNews_posts,
  getNews_postById,
  updateNews_post,
  deleteNews_postById
};

