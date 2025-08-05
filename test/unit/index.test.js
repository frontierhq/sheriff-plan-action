/* eslint-disable global-require */
/* eslint-env mocha */
const sinon = require('sinon');
const proxyquire = require('proxyquire');

describe('run', () => {
  let coreStub;
  let execStub;

  beforeEach(() => {
    coreStub = {
      getInput: sinon.stub(),
      setFailed: sinon.stub(),
    };
    execStub = {
      exec: sinon.stub().resolves(),
    };
  });

  it('should call exec with correct arguments', async () => {
    coreStub.getInput.withArgs('configDir').returns('/tmp/config');
    coreStub.getInput.withArgs('mode').returns('resources');
    coreStub.getInput.withArgs('subscriptionId').returns('sub123');

    const { run } = proxyquire('../../src/index', {
      '@actions/core': coreStub,
      '@actions/exec': execStub,
    });

    await run();

    sinon.assert.calledWith(
      execStub.exec,
      '/tmp/sheriff/latest/x86_64/sheriff',
      [
        'plan',
        'resources',
        '--config-dir',
        '/tmp/config',
        '--subscription-id',
        'sub123',
      ],
    );
  });

  it('should call setFailed on error', async () => {
    execStub.exec.rejects(new Error('fail'));
    coreStub.getInput.returns('test');

    const { run } = proxyquire('../../src/index', {
      '@actions/core': coreStub,
      '@actions/exec': execStub,
    });

    await run();

    sinon.assert.calledWith(coreStub.setFailed, 'fail');
  });
});
