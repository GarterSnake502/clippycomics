# Clippy Comics

Clippy Comics is a static site hosted on GitHub Pages. The current comic's
discussion is embedded with [Giscus](https://giscus.app/) and identified by
the comic's numeric ID (`0`, `1`, `2`, etc.), independently of the page URL.

## Enable comic discussions

1. In the repository's **Settings → General → Features**, enable **Discussions**.
2. Install/authorize the **Giscus** GitHub App for `GarterSnake502/ClippyComics`.
   Giscus needs access to Discussions; the repository must be public.
3. Open [giscus.app](https://giscus.app/), enter `GarterSnake502/ClippyComics`,
   and choose a Discussions category. Copy its **Repository ID**, **Category
   ID**, and **Category name** into `giscusConfig` in `index.js`.
4. Commit and push the change. GitHub Pages will publish it using the
   repository's existing Pages deployment configuration.

The embed uses Giscus's **specific term** mapping, with the comic ID as the
term. Giscus will create a separate discussion for each comic when someone
first leaves a comment; the associated discussion titles use the form
`Specific term: 0`, `Specific term: 1`, and so on. No manually created
discussion is needed for each comic.
