import { MongooseModuleAsyncOptions } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { getMongoConnectionString } from '@project/helpers';

export function getMongooseOptions(): MongooseModuleAsyncOptions {
  return {
    useFactory: async (config: ConfigService) => {
      return {
        uri: getMongoConnectionString({
          username: config.getOrThrow<string>('db.user'),
          password: config.getOrThrow<string>('db.password'),
          host: config.getOrThrow<string>('db.host'),
          port: config.getOrThrow<string>('db.port'),
          authDatabase: config.getOrThrow<string>('db.authBase'),
          databaseName: config.getOrThrow<string>('db.name'),
        }),
      };
    },
    inject: [ConfigService],
  };
}
