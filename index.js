#!/usr/bin/env node


const core = require('@actions/core');
const exec = require('@actions/exec');

async function run() {
  try {
    const configDir = core.getInput('configDir');
    const mode = core.getInput('mode');

    await exec.exec(
      'sheriff',
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
          ...env,
        },
        silent: false,
      },
    );

  } catch (err) {
    if (err instanceof Error) {
      core.setFailed(err.message);
    } else {
      core.setFailed('Unknown error');
    }
  }
}

run();
