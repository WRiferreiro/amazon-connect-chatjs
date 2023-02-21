# Npm Package Publish

Documentation for publishing to npmjs.org: https://docs.npmjs.com/creating-and-publishing-scoped-public-packages

### Publish New Version

```sh
npm login
npm publish --dry-run
npm publish --access=public
```

### View Package

View the new package: https://www.npmjs.com/package/amazon-connect-chatjs

### [AUTOMATION] GitHub Action Npm Publish Workflow

> Note: must have NPM_TOKEN set in GitHub Secrets, with `automation` permissions

#### Setup

By creating a GitHub deployment environment, you can set environment variables and specify users to approve.

- Become admin of the npm package
- Generate token on npm account, with `automation` permissions: https://docs.npmjs.com/creating-and-viewing-access-tokens
- Create/edit `release` environment, in GitHub settings: https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment
- Create environment secret `NPM_TOKEN`, and paste newly created token
- Add/remove users to the environment (eg. /settings/environments/873739246/edit)

#### Usage

To automate publishing, use the `npm-publish.yml` workflow:

- Commit to master branch
- Head to https://github.com/amazon-connect/amazon-connect-chatjs/releases
- Draft new release
- Choose tag, enter new semver
- Click, "create tag on publish"
- Publish the release
- Head to https://github.com/amazon-connect/amazon-connect-chatjs/actions
- Expand the pending Npm Publish workflow
- Review/approve the workflow
