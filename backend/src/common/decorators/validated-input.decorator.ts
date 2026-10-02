import { Body, Query, ValidationPipe, type Type } from '@nestjs/common';
// Explicit DTO types preserve validation when tsx/esbuild omits design:paramtypes.
const pipe = (type: Type<unknown>) => new ValidationPipe({ expectedType: type, whitelist: true, forbidNonWhitelisted: true, transform: true });
export const ValidatedBody = (type: Type<unknown>) => Body(pipe(type));
export const ValidatedQuery = (type: Type<unknown>) => Query(pipe(type));
