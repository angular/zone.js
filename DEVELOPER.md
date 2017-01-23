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

Please make sure you pass all following checks before commit 

- gulp lint (tslint) 
- gulp format:enforce (clang-format)
- gulp promisetest (promise a+ test)
- npm test (karma browser test)
- gulp test-node (node test)

You can run 

`npm run ci`

to do all those checks for you.
You can also add the script into your git pre-commit hook

```
echo -e 'exec npm run ci' > .git/hooks/pre-commit
chmod u+x .git/hooks/pre-commit 
```
