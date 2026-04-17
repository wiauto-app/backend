import { DataSource, DataSourceOptions } from "typeorm"

import {config} from "dotenv"
// import { fileURLToPath } from 'node:url';
// import path from 'node:path';


config()

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
export const typeOrmConfig: DataSourceOptions = {
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/**/*{.ts,.js}'],
  synchronize:false,
  logging:false
}

export const AppDataSource = new DataSource(typeOrmConfig)