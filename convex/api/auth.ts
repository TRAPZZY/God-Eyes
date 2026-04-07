import { mutation, query } from '../_generated/server'
import { v } from 'convex/values'
import { auth } from '@convex-dev/auth'

export const signIn = auth.defineAuth({
  signIn: mutation({
    args: {
      email: v.string(),
      password: v.string(),
    },
    handler: async (ctx, args) => {
      const user = await ctx.runQuery(auth.queryUser, { email: args.email })
      if (!user) throw new Error('Invalid credentials')
      return { session: user._id }
    },
  }),

  signUp: mutation({
    args: {
      email: v.string(),
      username: v.string(),
      password: v.string(),
      fullName: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
      const existing = await ctx.runQuery(auth.queryUser, { email: args.email })
      if (existing) throw new Error('Email already registered')

      const userId = await ctx.runMutation(auth.createUser, {
        email: args.email,
        name: args.username,
        password: args.password,
        fullName: args.fullName,
      })
      return { userId }
    },
  }),

  signOut: mutation({
    args: {},
    handler: async (ctx) => {
      const identity = await ctx.auth.getUserIdentity()
      if (!identity) throw new Error('Not authenticated')
    },
  }),
})

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
