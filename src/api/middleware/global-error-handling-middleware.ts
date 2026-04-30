import { Request,Response,NextFunction } from "express";
import ValidationError from "../../domain/errors/validation-error";
import NotFoundError from "../../domain/errors/not-found-error";
import UnauthorizedError from "../../domain/errors/unauthorized-error";

const globalErrorHandlingMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("=== ERROR CAUGHT ===");
  console.log("Error name:", err.name);
  console.log("Error message:", err.message);
  console.log("Error stack:", err.stack);
  console.log("Full error:", err);
  
  if (err instanceof ValidationError) {
    res.status(400).json({ message: err.message, error: err.message });
  } else if (err instanceof NotFoundError) {
    res.status(404).json({ message: err.message });
  } else if (err instanceof UnauthorizedError) {
    res.status(401).json({ message: err.message });
  } else {
    res.status(500).json({ 
      message: "Internal server error",
      error: err.message,  
      details: err.toString() 
    });
  }
};

export default globalErrorHandlingMiddleware;