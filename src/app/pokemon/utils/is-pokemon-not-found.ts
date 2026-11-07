import { HttpErrorResponse } from '@angular/common/http';

export function isPokemonNotFound(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 404;
}
