import 'dotenv/config';

import { NestFactory } from '@nestjs/core';

import { ValidationPipe } from '@nestjs/common';

import { IoAdapter } from '@nestjs/platform-socket.io';

import { createClient } from 'redis';

import { createAdapter } from '@socket.io/redis-adapter';

import { AppModule } from './app.module';



class RedisIoAdapter extends IoAdapter {

  private adapterConstructor!: ReturnType<typeof createAdapter>;



async connectToRedis(): Promise<void> {

    const pubClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });

    const subClient = pubClient.duplicate();



    await Promise.all([pubClient.connect(), subClient.connect()]);



    this.adapterConstructor = createAdapter(pubClient, subClient);

  }



  createIOServer(port: number, options?: any): any {

    const server = super.createIOServer(port, options);

    server.adapter(this.adapterConstructor);

    return server;

  }

}



async function bootstrap() {

  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  app.enableCors();



  const redisIoAdapter = new RedisIoAdapter(app);

  await redisIoAdapter.connectToRedis();

  app.useWebSocketAdapter(redisIoAdapter);



  await app.listen(3000);

}

bootstrap(); 