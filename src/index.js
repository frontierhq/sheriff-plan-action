#!/usr/bin/env node
const core = require('@actions/core');
const exec = require('@actions/exec');
const fs = require('fs');
const path = require('path');

async function getGithubOidcToken(audience = 'api://AzureADTokenExchange') {
  try {
    core.info(`Requesting OIDC token for audience: ${audience}`);
    const requestToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
    const requestUrl = process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
    if (!requestToken || !requestUrl) {
      throw new Error('OIDC environment variables are missing. Ensure id-token: write permission is enabled.');
    }
    const idToken = await core.getIDToken(audience);
    core.info(`Got OIDC token, length: ${idToken.length}`);
    return idToken;
  } catch (err) {
    throw new Error(`Failed to get OIDC token: ${err.message}`);
  }
}

async function run() {
  try {
    const configDir = core.getInput('configDir');
    const mode = core.getInput('mode');
    const subscriptionId = core.getInput('subscriptionId');
    const clientId = core.getInput('clientId');
    const tenantId = core.getInput('tenantId');
    const clientSecret = core.getInput('clientSecret');
    const authScheme = core.getInput('authScheme');

    process.env.AZURE_CLIENT_ID = clientId;
    process.env.AZURE_TENANT_ID = tenantId;
    process.env.AZURE_SUBSCRIPTION_ID = subscriptionId;

    // Detect auth scheme: OIDC (federated) or Service Principal
    if (authScheme === 'federated') {
      core.info('Using Workload Identity Federation (GitHub OIDC)...');
      // Fail fast if mandatory inputs are missing
      if (!subscriptionId || !clientId || !tenantId) {
        core.setFailed("Input 'subscriptionId', 'clientId', and 'tenantId' are required.");
        return;
      }
      const federatedToken = await getGithubOidcToken();
      const federatedTokenFilePath = path.join(process.env.RUNNER_TEMP || '/tmp', 'azure-identity-token');
      try {
        fs.writeFileSync(federatedTokenFilePath, federatedToken);
      } catch (err) {
        throw new Error(`Failed to write federated token file: ${err.message}`);
      }
      process.env.AZURE_FEDERATED_TOKEN_FILE = federatedTokenFilePath;
    } else if (authScheme === 'sp') {
      core.info('Using Service Principal with Client Secret...');
      // Fail fast if mandatory inputs are missing
      if (!subscriptionId || !tenantId || !clientId || !clientSecret) {
        core.setFailed("Input 'subscriptionId', 'clientId', 'tenantId', and 'clientSecret' are required.");
        return;
      }
      process.env.AZURE_CLIENT_SECRET = clientSecret;
    } else {
      throw new Error(`Invalid authScheme '${authScheme}'. Expected 'federated' or 'sp'.`);
    }
    await exec.exec(
      '/tmp/sheriff/latest/x86_64/sheriff',
      [
        'plan',
        mode,
        configDir ? '--config-dir' : '',
        configDir,
        '--subscription-id',
        subscriptionId,
      ],
      {
        env: {
          ...process.env,
        },
      },
    );
    core.info('Sheriff plan completed successfully');
  } catch (err) {
    core.setFailed(`Error: ${err.message}`);
  }
}

if (require.main === module) {
  run();
}

module.exports = { run };
