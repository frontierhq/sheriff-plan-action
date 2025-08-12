#!/usr/bin/env node

const core = require('@actions/core');
const exec = require('@actions/exec');
const fs = require('fs');
const path = require('path');
/*
async function authenticateWithFederatedIdentity(clientId, tenantId, subscriptionId) {
  try {
    const tokenFilePath = path.join(process.env.RUNNER_TEMP || '/tmp', 'azure_federated_token');
    core.info(`Creating federated token file at ${tokenFilePath}`);

    // Get GitHub OIDC token
    const idToken = await core.getIDToken();
    fs.writeFileSync(tokenFilePath, idToken, { mode: 0o600 });

    // Export environment variables for Azure CLI
    process.env.AZURE_FEDERATED_TOKEN_FILE = tokenFilePath;
    process.env.AZURE_CLIENT_ID = clientId;
    process.env.AZURE_TENANT_ID = tenantId;
    process.env.AZURE_SUBSCRIPTION_ID = subscriptionId;

    // Login using federated identity
    core.info('Logging into Azure using federated identity...');
    await exec.exec('az', ['login', '--federated-token', idToken, '--service-principal', '--tenant', tenantId, '--username', clientId]);

    // Set subscription
    core.info(`Setting Azure subscription to ${subscriptionId}`);
    await exec.exec('az', ['account', 'set', '--subscription', subscriptionId]);

  } catch (err) {
    core.setFailed(`Federated authentication failed: ${err.message}`);
    throw err;
  }
}
*/
async function run() {
  try {
    const configDir = core.getInput('configDir');
    const mode = core.getInput('mode');
    const subscriptionId = core.getInput('subscriptionId');
    /*const clientId = core.getInput('clientId');
    const tenantId = core.getInput('tenantId');
    const authScheme = core.getInput('authScheme') || '';

   if (authScheme.toLowerCase() === 'workloadidentityfederation') {
      await authenticateWithFederatedIdentity(clientId, tenantId, subscriptionId);
    }*/
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
    );
  } catch (err) {
    if (err instanceof Error) {
      core.setFailed(err.message);
    } else {
      core.setFailed('Unknown error');
    }
  }
}

if (require.main === module) {
  run();
}

module.exports = { run };
