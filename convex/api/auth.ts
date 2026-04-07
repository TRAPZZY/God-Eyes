import { query, mutation } from '../_generated/server'
import { v } from 'convex/values'

export const currentUser = query({
  args: {},
  handler: async () => {
    return null
  },
})

export const signIn = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first()

    if (!user) {
      throw new Error('Invalid email or password')
    }

    return { 
      success: true, 
      userId: user._id,
      email: user.email,
      username: user.username,
    }
  },
})

export const signUp = mutation({
  args: {
    email: v.string(),
    username: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first()
    
    if (existing) {
      throw new Error('Email already registered')
    }

    const userId = await ctx.db.insert('users', {
      email: args.email,
      username: args.username,
      fullName: undefined,
      role: 'operator',
      isActive: true,
      createdAt: Date.now(),
    })

    return { success: true, userId }
  },
})

export const signOut = mutation({
  args: {},
  handler: async () => {
    return { success: true }
  },
})
