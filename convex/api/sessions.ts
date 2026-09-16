import { query } from '../_generated/server'
import { getAuthUserId } from '@convex-dev/auth/server'

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      return null
    }

    const user = await ctx.db.get(userId)
    if (!user) {
      return null
    }

    const email = user.email ?? ''
    const username = user.username ?? user.name ?? email.split('@')[0] ?? 'user'

    return {
      id: user._id,
      email,
      username,
      full_name: user.fullName ?? user.name ?? username,
      role: user.role ?? 'operator',
      is_active: user.isActive ?? true,
      created_at: user.createdAt ? new Date(user.createdAt).toISOString() : null,
    }
  },
})
