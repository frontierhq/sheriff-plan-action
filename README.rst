.. image:: logo.png
  :width: 200
  :alt: Sheriff logo
  :align: center

===================
Sheriff Plan Action
===================

-----
About
-----

This is a Github Action that provides an interface to ``plan`` command for
`Sheriff <https://github.com/gofrontier-com/sheriff>`_, a command line tool to
manage Microsoft Entra Privileged Identity Management (Microsoft Entra PIM)
using desired state configuration.

-----
Usage
-----

This task runs the plan action of Sheriff CLI on the agent. The ``configDir`` input will point to
the location of the configuration files. The ``mode`` input describes whether Sheriff will perform the actions
on ``groups`` or ``resources``. The ``subscriptionId`` input is the Azure subscription ID.

.. code:: YAML

  steps:
    - name: Log in with Azure
      uses: azure/login@v1
      with:
        creds: '${{ secrets.AZURE_CREDENTIALS }}'

    - name: Sheriff Plan
      uses: gofrontier-com/sheriff-plan-action@initial-work
      with:
        configDir: config/resources
        mode: resources
        subscriptionId: '${{ secrets.SUBSCRIPTION_ID }}'

------------
Contributing
------------

We welcome contributions to this repository. Please see `CONTRIBUTING.md <https://github.com/gofrontier-com/sheriff-plan-action/tree/main/CONTRIBUTING.md>`_ for more information.
