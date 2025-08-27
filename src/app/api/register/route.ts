import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import UserModel from '@/models/User';

export async function POST(request: Request) {
  try {
    await dbConnect();

    const { name, email, password, role } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
    }

    if (password.length < 8) {
        return NextResponse.json({ message: "Password must be at least 8 characters." }, { status: 400 });
    }

    const existingUser = await UserModel.findOne({ email });

    if (existingUser) {
      return NextResponse.json({ message: 'An account with this email already exists.' }, { status: 409 });
    }

    // The pre-save hook in User.ts will hash the password
    const newUser = new UserModel({
      name,
      email,
      password,
      role,
    });

    await newUser.save();

    return NextResponse.json({ message: 'Account created successfully!' }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred on the server.' }, { status: 500 });
  }
}
