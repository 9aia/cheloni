import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: '/cheloni/',
  title: "Cheloni",
  description: "A modern, type-safe CLI framework for TypeScript. Build command-line tools with full type inference, Zod validation, and a powerful plugin system.",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guides', link: '/guides/getting-started/introduction' },
      { text: 'Reference', link: '/reference/index' },
      { text: 'Explanation', link: '/explanation/index' },
      { text: 'Examples', link: '/examples/index' },
    ],

    sidebar: {
      '/guides/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guides/getting-started/introduction' },
            { text: 'Quick Start', link: '/guides/getting-started/quick-start' },
          ]
        },
        {
          text: 'Essentials',
          items: [
            { text: 'Creating a CLI', link: '/guides/essentials/creating-a-cli' },
            { text: 'Creating Commands', link: '/guides/essentials/creating-commands' },
            { text: 'Defining Options', link: '/guides/essentials/defining-options' },
            { text: 'Defining Positional Args', link: '/guides/essentials/defining-positional-args' },
            { text: 'Creating Command Handlers', link: '/guides/essentials/creating-command-handlers' },
            { text: 'Defining Middleware', link: '/guides/essentials/defining-middleware' },
          ]
        },
        {
          text: 'Standard Library',
          items: [
            { text: 'Help', link: '/guides/std/help' },
            { text: 'Version', link: '/guides/std/version' },
            { text: 'Configuration', link: '/guides/std/config' },
          ]
        },
        {
          text: 'Toolchain',
          items: [
            { text: 'Dev Mode', link: '/guides/toolchain/dev-mode' },
            { text: 'CI', link: '/guides/toolchain/ci' },
            { text: 'Releasing', link: '/guides/toolchain/releasing' },
          ]
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Creating Middleware', link: '/guides/advanced/creating-middleware' },
            { text: 'Creating Global Options', link: '/guides/advanced/creating-global-options' },
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
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'File Converter', link: '/examples/01-file-converter' },
            { text: 'Task Manager', link: '/examples/02-task-manager' },
            { text: 'Benchmark', link: '/examples/03-benchmark' },
            { text: 'JSON Tool', link: '/examples/04-json-tool' },
            { text: 'Task Runner', link: '/examples/05-task-runner' },
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/9aia/cheloni' }
    ]
  }
})
