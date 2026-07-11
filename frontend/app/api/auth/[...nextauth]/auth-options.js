import bcrypt from 'bcrypt';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';

const authOptions = {
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
      profile(profile) {
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name || 'Anonymous',
          status: 'ACTIVE',
          roleId: '',
          roleName: 'user',
          avatar: profile.picture || null,
        };
      },
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: profile.id,
          email: profile.email,
          name: profile.name || 'Anonymous',
          status: 'ACTIVE',
          roleId: '',
          roleName: 'user',
          avatar: profile.picture?.data?.url || null,
        };
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider === 'google' || account.provider === 'facebook') {
        const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
        try {
          const res = await fetch(`${backendUrl}/api/auth/social`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              provider: account.provider,
              provider_id: account.providerAccountId || user.id,
              email: user.email,
              name: user.name || 'Anonymous User',
            }),
          });

          const data = await res.json();

          if (res.ok && data.token) {
            user.accessToken = data.token;
            user.id = data.user.id;
            user.status = data.user.status;
            user.roleId = data.user.role?.id || '';
            user.roleName = data.user.role?.name || 'user';
            user.avatar = data.user.avatar_url || data.user.avatar || null;
            return true;
          }

          console.error("Backend social auth failed:", data.message);
          return false;
        } catch (error) {
          console.error("Error exchanging social token with backend:", error);
          return false;
        }
      }
      return true;
    },
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
