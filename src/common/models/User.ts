import {DataTypes, Model, type Sequelize} from 'sequelize';

const UserModel = {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },
    age: { type: DataTypes.INTEGER }
};

export interface UserType {
    id: number;
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    age: number;
}

export const defineUser = (sequelize: Sequelize) => sequelize.define('user', UserModel);
