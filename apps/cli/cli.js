#!/usr/bin/env node

import { DeploymentCLI } from './deploy.js';

// Execute the CLI
const cli = new DeploymentCLI();
cli.runDeployCLI().catch(console.error);