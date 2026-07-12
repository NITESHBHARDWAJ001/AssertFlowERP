import { NextFunction, Request, Response } from "express";
import { AnyZodObject } from "zod";

interface ValidationSchemas {
  body?: AnyZodObject;
  params?: AnyZodObject;
  query?: AnyZodObject;
}

// Validates and re-assigns req.body/params/query with the parsed (and
// coerced/stripped) values so downstream handlers only ever see clean input.
export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params;
      if (schemas.query) req.query = schemas.query.parse(req.query) as typeof req.query;
      next();
    } catch (err) {
      next(err);
    }
  };
}
