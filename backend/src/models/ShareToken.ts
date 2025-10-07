import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";
import Document from "./Document";
import { v4 as uuidv4 } from "uuid";

export class ShareToken extends Model {
  public id!: string;
  public documentId!: string;
  public token!: string;
  public expiresAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Static method to generate a share token
  public static generateToken(): string {
    return uuidv4();
  }

  // Instance method to check if token is valid
  public isValid(): boolean {
    if (!this.expiresAt) return true;
    return new Date() < this.expiresAt;
  }
}

ShareToken.init(
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
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      defaultValue: () => uuidv4(),
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "ShareToken",
    tableName: "share_tokens",
    timestamps: true,
  }
);

// Define associations
ShareToken.belongsTo(Document, { foreignKey: "documentId", as: "document" });
Document.hasMany(ShareToken, { foreignKey: "documentId", as: "shareTokens" });

export default ShareToken;