import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcrypt';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import prisma from '@/lib/prisma';

const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
        rememberMe: { label: 'Remember me', type: 'boolean' },
      },
      async authorize(credentials) {
        if (!credentials || !credentials.email || !credentials.password) {
          throw new Error(
            JSON.stringify({
              code: 400,
              message: 'Please enter both email and password.',
            }),
          );
        }

        const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
        try {
          const res = await fetch(`${backendUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              login: credentials.email,
              password: credentials.password,
            }),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(
              JSON.stringify({
                code: res.status,
                message: data.message || 'Giriş başarısız.',
              }),
            );
          }

          return {
            id: data.user.id,
            status: data.user.status,
            email: data.user.email,
            name: data.user.name || 'Anonymous',
            roleId: data.user.role?.id || '',
            roleName: data.user.role?.name || 'user',
            avatar: data.user.avatar_url || data.user.avatar || null,
            accessToken: data.token,
          };
        } catch (error) {
          try {
            const parsed = JSON.parse(error.message);
            if (parsed.code && parsed.message) {
              throw error;
            }
          } catch {}

          throw new Error(
            JSON.stringify({
              code: 500,
              message: error.message || 'Backend bağlantı hatası.',
            }),
          );
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
      async profile(profile) {
        const existingUser = await prisma.user.findUnique({
          where: { email: profile.email },
          include: {
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        if (existingUser) {
          // Update `lastSignInAt` field for existing users
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              name: profile.name,
              avatar: profile.picture || null,
              lastSignInAt: new Date(),
            },
          });

          return {
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.name || 'Anonymous',
            status: existingUser.status,
            roleId: existingUser.roleId,
            roleName: existingUser.role.name,
            avatar: existingUser.avatar,
          };
        }

        const defaultRole = await prisma.userRole.findFirst({
          where: { isDefault: true },
        });

        if (!defaultRole) {
          throw new Error(
            'Default role not found. Unable to create a new user.',
          );
        }

        // Create a new user and account
        const newUser = await prisma.user.create({
          data: {
            email: profile.email,
            name: profile.name,
            password: '', // No password for OAuth users
            avatar: profile.picture || null,
            emailVerifiedAt: new Date(),
            roleId: defaultRole.id,
            status: 'ACTIVE',
          },
        });

        return {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name || 'Anonymous',
          status: newUser.status,
          avatar: newUser.avatar,
          roleId: newUser.roleId,
          roleName: defaultRole.name,
        };
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user, session, trigger }) {
      if (trigger === 'update' && session?.user) {
        token = session.user;
      } else {
        if (user) {
          token.id = user.id || token.sub;
          token.email = user.email;
          token.name = user.name;
          token.avatar = user.avatar;
          token.status = user.status;
          token.roleId = user.roleId;
          token.roleName = user.roleName;
          token.accessToken = user.accessToken;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.avatar = token.avatar;
        session.user.status = token.status;
        session.user.roleId = token.roleId;
        session.user.roleName = token.roleName;
        session.user.accessToken = token.accessToken;
      }
      return session;
    },
  },
  pages: {
    signIn: '/signin',
  },
};

export default authOptions;
