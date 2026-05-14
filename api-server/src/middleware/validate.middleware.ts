import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from '../common/errors';

/**
 * Middleware factory for Zod request validation.
 * Validates body, query, or params depending on the `source` parameter.
 *
 * @example
 * router.post('/', validate(createProductSchema, 'body'), controller.create);
 * router.get('/', validate(searchSchema, 'query'), controller.list);
 */
export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.') || 'value';
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path].push(issue.message);
      }
      next(new ValidationError(fieldErrors));
      return;
    }

    // Replace with parsed (and possibly transformed) data
    req[source] = result.data;
    next();
  };
}
