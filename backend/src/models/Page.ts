import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";
import Document from "./Document";

export class Page extends Model {
  public id!: string;
  public documentId!: string;
  public pageNumber!: number;
  public content!: string;
  public embedding!: number[];
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Page.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    documentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Document,
        key: "id",
      },
    },
    pageNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    embedding: {
      type: DataTypes.ARRAY(DataTypes.FLOAT),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Page",
    tableName: "pages",
    timestamps: true,
    indexes: [
      {
        fields: ["documentId", "pageNumber"],
        unique: true,
      },
    ],
  }
);

// Define associations
Page.belongsTo(Document, { foreignKey: "documentId", as: "document" });
Document.hasMany(Page, { foreignKey: "documentId", as: "pages" });

export default Page;