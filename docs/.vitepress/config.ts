import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Cheloni",
  description: "A modern, type-safe CLI framework for TypeScript. Build command-line tools with full type inference, Zod validation, and a powerful plugin system.",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guides', link: '/guides/getting-started' },
      { text: 'Reference', link: '/reference/api/index' },
      { text: 'Explanation', link: '/explanation/index' }
    ],

    sidebar: {
      '/guides/': [
        {
          text: 'Basics',
          items: [
            { text: 'Getting Started', link: '/guides/getting-started' },
            { text: 'Creating CLI', link: '/guides/creating-cli' },
            { text: 'Creating Commands', link: '/guides/command/creating-commands' },
            { text: 'Defining Options', link: '/guides/command/defining-options' },
            { text: 'Defining Positional Args', link: '/guides/command/defining-positional-args' },
            { text: 'Writing Handlers', link: '/guides/command/writing-handlers' },
            { text: 'Defining Middleware', link: '/guides/command/defining-middleware' },
          ]
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Creating Middleware', link: '/guides/command/creating-middleware' },
            { text: 'Creating Global Options', link: '/guides/command/creating-global-options' },
            { text: 'Creating Packs', link: '/guides/advanced/creating-packs' },
            { text: 'Creating Plugins', link: '/guides/advanced/creating-plugins' }
          ]
        },
      ],
      '/reference/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Core API', link: '/reference/api/core/index' },
            {
              text: 'Core',
              items: [
                { text: 'Definition', link: '/reference/api/core/definition' },
                { text: 'Creation', link: '/reference/api/core/creation' },
                { text: 'Execution', link: '/reference/api/core/execution' },
                { text: 'Manifest', link: '/reference/api/core/manifest' }
              ]
            },
            { text: 'Standard Library', link: '/reference/api/std/index' }
          ]
        },
        {
          text: 'CLI Reference',
          items: [
            { text: 'CLI', link: '/reference/cli/index' }
          ]
        }
      ],
      '/explanation/': [
        {
          text: 'Explanations',
          items: [
            { text: 'Overview', link: '/explanation/index' },
            { text: 'Options Schema', link: '/explanation/options-schema' },
            { text: 'Throw on Extrageous Options', link: '/explanation/throw-on-extrageous-options' },
            { text: 'Error Handling', link: '/explanation/error-handling' },
            { text: 'Alias in Schema', link: '/explanation/alias-in-schema' }
          ]
        },
        {
          text: 'How It Works',
          items: [
            { text: 'Overview', link: '/explanation/how-it-works/index' },
            {
              text: 'Core',
              items: [
                { text: 'Definition', link: '/explanation/how-it-works/core/definition' },
                { text: 'Creation', link: '/explanation/how-it-works/core/creation' },
                { text: 'Execution', link: '/explanation/how-it-works/core/execution' },
                { text: 'Manifest', link: '/explanation/how-it-works/core/manifest' }
              ]
            },
            { text: 'Standard Library', link: '/explanation/how-it-works/std/index' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/9aia/cheloni' }
    ]
  }
})
