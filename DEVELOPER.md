Submitting Changes
------------------

Do NOT submit changes to the built files in the `dist` folder. These are generated before
releases.


To run tests
------------

Make sure your environment is set up with:

`npm install`

In a separate process, run the WebSockets server:

`npm run ws-server`

Run the browser tests using Karma:

`npm test`

Run the node.js tests:

`npm run test-node`

Run tslint:

`npm run lint`

Run format with clang-format:

`npm run format`

Run all checks (lint/format/browser test/test-node):

`npm run ci`

Before Commit
------------

Pre-commit hook will be executed and following check will
automatically run before commit.

- tslint
- format:enforce (clang-format)
- npm test (karma test)
- test-node (node test)
