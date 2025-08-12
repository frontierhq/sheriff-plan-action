#!/usr/bin/env node

const core = require('@actions/core');
const exec = require('@actions/exec');
const fs = require('fs');
const path = require('path');
const { execSync } = require("child_process");
const fetch = require("node-fetch");

async function getGithubOidcToken(audience = "api://AzureADTokenExchange") {
  const requestToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
  const requestUrl = process.env.ACTIONS_ID_TOKEN_REQUEST_URL;

  if (!requestToken || !requestUrl) {
    throw new Error("OIDC environment variables are missing. Ensure id-token: write permission is enabled.");
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

   const env = {
      AZURE_SUBSCRIPTION_ID: subscriptionId,
   };
  
   // Detect auth scheme: OIDC (federated) or Service Principal
   if (process.env.GITHUB_ACTIONS && process.env.ACTIONS_ID_TOKEN_REQUEST_URL) {
     console.log("Using Workload Identity Federation (GitHub OIDC)...");
     env.AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID;
     env.AZURE_TENANT_ID = process.env.AZURE_TENANT_ID;

     const federatedToken = await getGithubOidcToken();
     const federatedTokenFilePath = path.join(process.env.RUNNER_TEMP || "/tmp", "azure-identity-token");
     fs.writeFileSync(federatedTokenFilePath, federatedToken);
     env.AZURE_FEDERATED_TOKEN_FILE = federatedTokenFilePath;
    } else if (process.env.AZURE_CLIENT_SECRET) {
      console.log("Using Service Principal with Client Secret...");
      env.AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID;
      env.AZURE_TENANT_ID = process.env.AZURE_TENANT_ID;
      env.AZURE_CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;
    } else {
      throw new Error("No valid Azure authentication method found.");
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
          ...env
        }
      }
    );
    console.log("Sheriff plan completed successfully");
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}

module.exports = { run };
