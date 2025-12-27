
import { envMode } from "../app.js";
  
export const errorMiddleware = (
  err,
  req,
  res,
  // eslint-disable-next-line no-unused-vars
  next
)=> {
  
  err.message||= "Internal Server Error";
  err.statusCode = err.statusCode || 500;
    
  const response = {
    success: false,
    error: err.message,
    message: err.message,
  };
  
  if (envMode === "DEVELOPMENT") {
    response.stack = err.stack;
  }
  
  return res.status(err.statusCode).json(response);
  
};
  
export const TryCatch = (passedFunc) => async (req, res, next) => {
 try {
    await passedFunc(req, res, next);
 } catch (error) {
    next(error);
   }
};
  
  
  