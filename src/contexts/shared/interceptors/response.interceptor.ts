import { CallHandler, ExecutionContext, NestInterceptor } from "@nestjs/common";
import { Injectable } from "../dependency-injectable/injectable";
import { map } from "rxjs/operators";
import { Observable } from "rxjs";
import { Response } from "express";

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const response = http.getResponse<Response>();
    return next.handle().pipe(
      map((data) => ({
        ok: true,
        status: response.statusCode,
        data,
      })),
    );
  }
}