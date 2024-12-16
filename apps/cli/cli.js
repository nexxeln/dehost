#!/usr/bin/env node

import chalk from 'chalk';
import { fileURLToPath } from 'url';
import path from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DehostCLI {
    // 'Dehost' ASCII Art
    static dehostArt = `
   DDDD   EEEEE  H   H  OOO   SSSS  TTTTT
   D   D  E      H   H O   O S        T
   D   D  EEEE   HHHHH O   O  SSS     T
   D   D  E      H   H O   O     S     T
   DDDD   EEEEE  H   H  OOO   SSSS    T
  `;

    // Handle 'deploy' command
    async handleDeployCommand() {
        try {
            const { default: DeploymentCLI } = await import('./deploy.js');
            const deploy_cli = new DeploymentCLI();
            await deploy_cli.runDeployCLI();
        } catch (error) {
            console.error(chalk.red('Deploy command failed:'), error);
        }
    }

    // Handle 'login' command
    async handleLoginCommand() {
        try {
            const { default: AuthCLI } = await import('./cli-auth.js');
            const login_cli = new AuthCLI();
            await login_cli.runAuthCLI();
        } catch (error) {
            console.error(chalk.red('Login command failed:'), error);
        }
    }

    // Handle 'dehost' command which displays the ASCII art of 'Dehost'
    async handleDehostCommand() {
        console.log(chalk.hex('#800080')(DehostCLI.dehostArt)); // Display ASCII art in purple
    }

    async run() {
        const command = process.argv[2]; // The first argument after the command (e.g., 'deploy', 'login', 'dehost')

        // If no command is provided, show ASCII art
        if (!command) {
            await this.handleDehostCommand();
            return;
        }
        
        switch (command) {
            case 'deploy':
                await this.handleDeployCommand();
                break;

            case 'login':
                await this.handleLoginCommand();
                break;

            default:
                console.log(chalk.red('Unknown command. Please use "dehost deploy", "dehost login", or just "dehost".'));
                break;
        }
    }
}

// Run the CLI
const cli = new DehostCLI();
cli.run().catch(console.error);
