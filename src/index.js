#!/usr/bin/env node

const core = require('@actions/core');
const exec = require('@actions/exec');

async function run() {
  try {
    const configDir = core.getInput('configDir');
    const mode = core.getInput('mode');
    const subscriptionId = core.getInput('subscriptionId');

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
