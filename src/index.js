#!/usr/bin/env node
/* eslint-disable no-console */
const core = require('@actions/core');
const exec = require('@actions/exec');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

async function getGithubOidcToken(audience = 'api://AzureADTokenExchange') {
  const requestToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
  const requestUrl = process.env.ACTIONS_ID_TOKEN_REQUEST_URL;

  if (!requestToken || !requestUrl) {
    throw new Error('OIDC environment variables are missing. Ensure id-token: write permission is enabled.');
  }

  const res = await fetch(`${requestUrl}&audience=${encodeURIComponent(audience)}`, {
    headers: {
      Authorization: `Bearer ${requestToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to get OIDC token: ${res.status} ${await res.text()}`);
  }

  const { value } = await res.json();
  return value;
}

async function run() {
  try {
    const configDir = core.getInput('configDir');
    const mode = core.getInput('mode');
    const subscriptionId = core.getInput('subscriptionId');
    const clientId = core.getInput('clientId');
    const tenantId = core.getInput('tenantId');
    const clientSecret = core.getInput('clientSecret');

    process.env.AZURE_CLIENT_ID = clientId;
    process.env.AZURE_TENANT_ID = tenantId;
    process.env.AZURE_SUBSCRIPTION_ID = subscriptionId;
    process.env.AZURE_CLIENT_SECRET = clientSecret;
    // Detect auth scheme: OIDC (federated) or Service Principal
    if (process.env.GITHUB_ACTIONS && process.env.ACTIONS_ID_TOKEN_REQUEST_URL) {
      console.log('Using Workload Identity Federation (GitHub OIDC)...');
      const federatedToken = await getGithubOidcToken();
      const federatedTokenFilePath = path.join(process.env.RUNNER_TEMP || '/tmp', 'azure-identity-token');
      fs.writeFileSync(federatedTokenFilePath, federatedToken);
      process.env.AZURE_FEDERATED_TOKEN_FILE = federatedTokenFilePath;
    } else if (process.env.AZURE_CLIENT_SECRET) {
      console.log('Using Service Principal with Client Secret...');
    } else {
      throw new Error('No valid Azure authentication method found.');
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
    console.log('Sheriff plan completed successfully');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}

module.exports = { run };
