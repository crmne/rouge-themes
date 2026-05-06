# Rouge Themes

A static Jekyll gallery for previewing every theme exposed by the installed Rouge gem, plus Pygments and community stylesheets that work with Rouge-compatible HTML.

The existing public preview at <https://spsarolkar.github.io/rouge-theme-preview/> is useful, but this repo regenerates its catalog from the current `rouge` gem, adds Pygments-compatible styles as `pygments.*`, adds vendored community CSS themes as `community.*`, and includes editable example snippets for a broader set of languages.

## Development

```sh
bundle install
bundle exec ruby script/generate_rouge_assets.rb
bundle exec jekyll serve --livereload
```

## Deployment

GitHub Pages is deployed by `.github/workflows/pages.yml` on pushes to `master` and by manual workflow dispatch. In the repository settings, set Pages to use GitHub Actions as the source.

The workflow installs Ruby gems, installs Python Pygments for the expanded theme catalog, regenerates the theme assets, builds Jekyll with GitHub Pages' `base_path`, and deploys `_site`.

The generator writes:

- `_data/rouge.yml`
- `assets/css/rouge-themes.css`

Run it again after updating the `rouge` gem, updating the local Python `pygments` package, or adding files under `_community_themes/`. If Pygments is not available, the generator still builds the Rouge default and vendored community themes.

## Static Editable Preview

Rouge runs in Ruby at build time, so a fully static site cannot send arbitrary edited code through Rouge without a server or a Ruby runtime in the browser. The editable examples use the bundled Highlight.js browser build, map its token classes to Rouge-style token classes, and apply the selected Rouge theme CSS. It is useful for quick visual checks without adding a server.

## Theme Names

Built-in Rouge themes use their exact `rougify style` names, such as `github.dark` or `monokai.sublime`.

RubyLLM docs use `gruvbox.light` and `gruvbox.dark` through `jekyll-vitepress-theme`, then display them on VitePress/RubyLLM code-block backgrounds. The gallery includes `rubyllm.docs.light` and `rubyllm.docs.dark` to reproduce that rendered display; use `gruvbox.light` and `gruvbox.dark` when configuring Rouge directly.

Pygments-compatible themes are shown with a `pygments.` prefix, such as `pygments.dracula`. That prefix is the gallery's namespace to avoid collisions with Rouge themes. To regenerate the original Pygments CSS directly, remove the prefix and use the Pygments style name, for example `dracula`.

Vendored community styles are shown with a `community.` prefix, such as `community.tomorrow_night`. These are already Rouge/Pygments-compatible CSS files sourced from <https://numist.github.io/highlight-css/>.
