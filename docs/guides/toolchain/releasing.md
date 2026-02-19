::: warning (In roadmap)
This workflow is planned and may change.
:::

# Releasing

- `cheloni release` (powered by **release-it** and **GitHub CLI**)

Planned behavior:

- Bump the package version
- Git commit and tag the release
- Runs `cheloni build` (powered by **Bun**)
- Releases the package to **npm**
- Creates a release on **GitHub Releases**
- Runs `cheloni docs:deploy` (powered by **Cypera**) and publishes docs to **GitHub Pages**
