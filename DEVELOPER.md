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
