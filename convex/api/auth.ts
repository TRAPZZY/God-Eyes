import { query, mutation } from '../_generated/server'
import { v } from 'convex/values'

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', identity.email!))
      .first()

    if (!user) return null

    return {
      id: user._id,
      email: user.email,
      username: user.username,
      full_name: user.fullName ?? user.username,
      role: user.role,
    }
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

    if (!user) throw new Error('Invalid credentials')
    
    return { success: true }
  },
})

export const signUp = mutation({
  args: {
    email: v.string(),
    username: v.string(),
    password: v.string(),
    fullName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first()
    
    if (existing) throw new Error('Email already registered')

    const userId = await ctx.db.insert('users', {
      email: args.email,
      username: args.username,
      fullName: args.fullName,
      role: 'operator',
      isActive: true,
      createdAt: Date.now(),
    })

    return { userId }
  },
})

export const signOut = mutation({
  args: {},
  handler: async (ctx) => {
    return { success: true }
  },
})
