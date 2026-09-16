import { convexAuth } from '@convex-dev/auth/server'
import { Password } from '@convex-dev/auth/providers/Password'

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        const email = String(params.email || '').trim().toLowerCase()
        const username = String(params.username || email.split('@')[0] || 'user').trim()
        const fullName = params.fullName ? String(params.fullName).trim() : undefined

        if (!email || !email.includes('@')) {
          throw new Error('Enter a valid email address.')
        }
        if (username.length < 3) {
          throw new Error('Display name must have at least 3 characters.')
        }

        return {
          email,
          name: fullName || username,
          username,
          ...(fullName ? { fullName } : {}),
          role: 'operator',
          isActive: true,
          createdAt: Date.now(),
        }
      },
    }),
  ],
})
