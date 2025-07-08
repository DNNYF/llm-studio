'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  try {
    const query = 'SELECT * FROM users WHERE username = $1';
    const { rows } = await db.query(query, [email]);
    
    if (rows.length === 0) {
        return { error: 'Invalid email or password' };
    }

    const user = rows[0];

    // Pakai bcrypt compare
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (isPasswordValid) {
      const sessionToken = 'authenticated'; 

      cookies().set('session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 , // 1 day
        path: '/',
      });

      return redirect('/admin');
    } else {
      return { error: 'Invalid email or password' };
    }

  } catch (error) {
    console.error('Database login error:', error);
    return { error: 'An internal error occurred. Please try again.' };
  }
}