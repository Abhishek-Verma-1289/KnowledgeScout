import { Sequelize } from "sequelize";
import { logger } from "../utils/logger";

const sequelize = new Sequelize(
  process.env.DATABASE_URL || "sqlite:./database.sqlite",
  {
    dialect: process.env.DATABASE_URL?.startsWith("postgresql") ? "postgres" : "sqlite",
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    storage: "./database.sqlite", // SQLite storage file
  }
);

export const connectDB = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: process.env.NODE_ENV !== "production" });
    logger.info("Database connection established successfully");
  } catch (error) {
    logger.error("Unable to connect to database:", error);
    throw error;
  }
};

export { sequelize };
export default sequelize;