/**
 * Unit test dasar untuk AppController.
 * Tujuannya memastikan wiring controller + service berjalan.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  // Menyiapkan TestingModule baru sebelum tiap test case.
  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    // Ambil instance controller dari container testing.
    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    // Assert sederhana: output method harus sesuai ekspektasi.
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
