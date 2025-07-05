
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  try {
    // Note: The database table is assumed to be 'users' and the email is stored in the 'username' column.
    const query = 'SELECT * FROM users WHERE username = $1';
    const { rows } = await db.query(query, [email]);
    
    if (rows.length === 0) {
        return { error: 'Invalid email or password' };
    }

    const user = rows[0];

    // In a real application, you should always hash passwords before storing and comparing them.
    // This is a simple plaintext comparison because the database schema provided stores plaintext.
    const isPasswordValid = user.password === password;

    if (isPasswordValid) {
      const sessionToken = 'authenticated'; 

      cookies().set('session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 week
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
