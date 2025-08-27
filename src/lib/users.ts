import dbConnect from "@/lib/db";
import UserModel from "@/models/User";
import type { IUser } from "@/models/User";

export async function findUserByEmail(email: string): Promise<IUser | null> {
    await dbConnect();
    const user = await UserModel.findOne({ email }).lean();
    if (user) {
        return user as IUser;
    }
    return null;
}

export async function createUser(userData: Pick<IUser, 'name' | 'email' | 'password' | 'role'>): Promise<IUser> {
    await dbConnect();
    const user = new UserModel(userData);
    await user.save();
    return user;
}
