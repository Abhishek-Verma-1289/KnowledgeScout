import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";
import User from "./User";

export class Document extends Model {
  public id!: string;
  public ownerId!: string;
  public title!: string;
  public filename!: string;
  public filePath!: string;
  public fileSize!: number;
  public mimeType!: string;
  public visibility!: "private" | "public";
  public shareToken?: string;
  public isIndexed!: boolean;
  public pageCount!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Document.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 255],
      },
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    visibility: {
      type: DataTypes.ENUM("private", "public"),
      defaultValue: "private",
    },
    shareToken: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    isIndexed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    pageCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: "Document",
    tableName: "documents",
    timestamps: true,
  }
);

// Define associations
Document.belongsTo(User, { foreignKey: "ownerId", as: "owner" });
User.hasMany(Document, { foreignKey: "ownerId", as: "documents" });

export default Document;