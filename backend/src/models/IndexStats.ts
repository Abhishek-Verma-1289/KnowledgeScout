import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";

export class IndexStats extends Model {
  public id!: string;
  public totalDocuments!: number;
  public totalPages!: number;
  public indexedDocuments!: number;
  public unindexedDocuments!: number;
  public totalEmbeddings!: number;
  public lastIndexUpdate!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

IndexStats.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    totalDocuments: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    totalPages: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    indexedDocuments: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    unindexedDocuments: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    totalEmbeddings: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    lastIndexUpdate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "IndexStats",
    tableName: "index_stats",
    timestamps: true,
  }
);

export default IndexStats;