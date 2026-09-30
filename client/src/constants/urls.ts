const routes = {
  // Base segment
  api: {
    toString() {
      return '/api'
    },

    // Auth domain
    auth: {
      toString() {
        return `${routes.api}/auth`
      },

      // Individual actions
      get register() {
        return `${routes.api.auth}/register`
      },
      get login() {
        return `${routes.api.auth}/login`
      },
    },

    // User domain
    user: {
      toString() {
        return `${routes.api}/user`
      },

      // Individual actions
      get details() {
        return `${routes.api.user}/details`
      },
    },
  },
}

// 1. Get '/api' directly
console.log(`${routes.api}`)
// Output: /api

// 2. Get '/api/auth/login' directly using dot notation
console.log(routes.api.auth.login)
// Output: /api/auth/login

// Bonus: You can also get mid-level paths directly
console.log(`${routes.api.auth}`)
// Output: /api/auth

export default routes
