### Usage
This is a single-page application using react-redux, and [browserify][], written with [ES2015][] syntax. Provides logging support, fast, incremental development builds with auto-refreshing. This also uses react-router, so when deploying to s3 and cloudfront, be sure to redirect (opaque) 404s back to the SPA.

### System setup
- Install [Node Version Manager][]
- Install the latest version of nodejs `nvm install --lts`

#### Configuration
This project uses ENV variables like `LOG_LEVEL` and `PORT`.
`npm run *` will load these variables from your `.env` file, if it exists.
Running `make` directly will not.
See [`example.env`](example.env).


### Application setup

```sh
$ cd ui/
$ npm install

# development
$ npm <start|test|repl>

# build for production
# remember to set NODE_ENV to disable certain development features.
$ NODE_ENV=production make

$ make help
prod       Production build (default)
dev        Development build plus file server and automatic rebuild & refresh
test-watch Run the test suite and watch for changes
test-debug Run the test suite with node-inspector
test       Run the test suite (e.g. for the CI server)
clean      Remove build artifacts
list       Print each file in the dependency graph
help       You're looking at it
```

> What's the difference between `npm test` and `make test`?
> The former is intended to be used by a human, and will load `.env`.
> The latter is intended for scripting.

### Deployment guide
- Create a new s3 bucket
- Enable static website hosting and make all files public
- Create a new cloudfront distribution with the s3 bucket as an origin: `$AWS_S3_BUCKET.s3.amazonaws.com`
- Compress objects automatically
- Configure a cloudfront 404 error page to respond with `200 /index.html`, since this is a SPA with client-side routing
After S3 and cloudfront have been configured use `AWS_S3_BUCKET=... AWS_CLOUDFRONT_ID=... NODE_ENV=production make prod deploy` to send any changed files to S3 and clear the cloudfront cache.

### Common problems in the javascript workflow, solved:
- `source-map-support` is inculded in the development build and sourcemaps **just work** in the browser for both stylesheets and javascript (esp. `err.stack`)
- sourcemaps are also applied to the test suite; use the chrome debugger and set breakpoints with `npm run test-debug`
- Since Chrome supports most ES2015 features natively, many babel transforms are disabled during development, allowing you to set precise breakpoints with the chrome debugger and ensuring you get the most useful error messages possible.
- React component hot-reloading, notoriously unreliable, is NOT included. Stylesheets are hot-reloaded, otherwise the whole page is refreshed.
- build errors are echoed in the browser console instead of refreshing an old build
- access a REPL with full babel support via `npm run repl`; you can `require` modules which use the `import/export` syntax!

### Semi-flat directory structure
By avoiding nested directories beyond **two** levels, we no longer have to remember how many `"../../"` to use when requiring a module: `require('../../../foo')`. AKA "path hell". If everything follows the pattern: `{src,test}/*/*.js` then, at most, one `"../"` is needed for any given module. This is an effective compromise between having *one mega-directory* `require('./any-module')`, and having *too many nested subdirectories* `require('../../../some/nested/module')`. Lots of nested directories may work for Java & PHP where classes can be loaded automatically and paths don't really matter, but this certainly does not work for javascript where we need relative paths.

#### `src/api`
Since there's probably some server-side counterpart to this application, it's a good idea to create a client-side library for that API. You wouldn't want to make bare XHR requests to the google/dropbox/etc all the time, would you? Treat your server-side application like any other 3rd party API. A documented method for each API request not only makes it easy to use, but it becomes easier to understand what effect any changes may have to the rest of the codebase.

#### `src/actions`
Use [redux][] to declare a finite number of user interactions for the application. Tracing through the application becomes much easier when debugging, or even when just learning how the project works. Anything that modifies global application data should be the result of an *action*.

#### `src/components`
This is where all the `React.Component` definitions live. These are all named with PascalCase.

#### `src/model`
Contains the [redux][] store and reducers.

### `src/styles`
This is where all the [SCSS][] lives, many React Components will have a counterpart file here. New files should be added to `index.scss`

### Style guide
Although the process will differ depending on which editor you prefer (vim/sublime/atom/?), you'll want to set up JSX & es2015 syntax highlighting, and install [eslint][] and [eslint-plugin-react][] to use the provided [eslint-config][]. ESLint will enforce some coding style as well as help catch some common errors. Unless otherwise noted, files are named with with snake-case. Use camelCase for variables.

For CSS, try to follow the guidelines laid out by [rscss][].

[ES2015]: https://babeljs.io
[SCSS]: https://github.com/sass/node-sass
[browserify]: https://github.com/substack/node-browserify
[eslint-config]: .eslintrc.yml
[eslint-plugin-react]: https://github.com/yannickcr/eslint-plugin-react
[eslint]: http://eslint.org
[preact-comat]: https://github.com/developit/preact-compat
[redux]: https://github.com/reactjs/redux
[rscss]: http://rscss.io
[Node Version Manager]: https://github.com/creationix/nvm#installation
