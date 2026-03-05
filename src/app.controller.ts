/**
 * Controller paling sederhana untuk health check.
 * Endpoint GET / dipakai untuk memastikan service hidup.
 */
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service.js';

// @ApiTags dipakai Swagger untuk mengelompokkan endpoint.
@ApiTags('Health')
// @Controller() menandai class ini sebagai HTTP controller.
@Controller()
export class AppController {
  // Constructor injection: AppService otomatis di-resolve oleh DI Nest.
  constructor(private readonly appService: AppService) {}

  // @Get() memetakan method ini ke HTTP GET pada path controller ('/').
  @Get()
  @ApiOperation({ summary: 'Health check' })
  // Method controller sebaiknya tipis: terima request, panggil service, return result.
  getHello(): string {
    return this.appService.getHello();
  }
}
