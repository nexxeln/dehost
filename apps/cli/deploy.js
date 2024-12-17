import { intro, outro, spinner } from '@clack/prompts';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import chalk from 'chalk';
import lighthouse from '@lighthouse-web3/sdk';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

class DeploymentCLI {
  constructor() {
    this.apiKey = process.env.LIGHTHOUSE_API_KEY;
    if (!this.apiKey) {
      console.error(chalk.red('Lighthouse API key not found. Set the LIGHTHOUSE_API_KEY environment variable.'));
      process.exit(1);
    }
  }

  detectFramework() {
    const projectPath = process.cwd();
    const packageJsonPath = path.join(projectPath, 'package.json');

    try {
      if (!fs.existsSync(packageJsonPath)) {
        // Check for index.html in root
        const indexPath = path.join(projectPath, 'index.html');
        return fs.existsSync(indexPath) ? 'Static' : null;
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      if (packageJson.dependencies?.next || packageJson.devDependencies?.next) {
        return 'Next.js';
      }
      if (packageJson.dependencies?.react || packageJson.devDependencies?.react) {
        return 'React';
      }
      if (packageJson.dependencies?.vue || packageJson.devDependencies?.vue) {
        return 'Vue';
      }
      if (packageJson.dependencies?.['@angular/core'] || packageJson.devDependencies?.['@angular/core']) {
        return 'Angular';
      }

      return null;
    } catch (error) {
      console.error(chalk.red('Error detecting framework:'), error.message);
      return null;
    }
  }

  async uploadToIPFS(filePath, fileName) {
    const s = spinner();
    s.start(`Uploading ${fileName} to IPFS...`);
  
    try {
      if (!this.apiKey) {
        throw new Error('No API key provided. Set LIGHTHOUSE_API_KEY environment variable.');
      }
  
      const fileBuffer = fs.readFileSync(filePath);
      
      console.log(chalk.yellow('Debug: Uploading with API Key - ' + this.apiKey.substring(0, 5) + '...')); // Safe logging
  
      const response = await lighthouse.uploadBuffer(fileBuffer, this.apiKey, {
        // Optional additional configuration
        wrapWithDirectory: false,
        multiUpload: false
      });
  
      console.log(chalk.yellow('Debug: Full Lighthouse Response:'), response);
  
      if (response && response.data && response.data.Hash) {
        const ipfsHash = response.data.Hash;
        const ipfsUrl = `https://gateway.lighthouse.storage/ipfs/${ipfsHash}`;
  
        s.stop(chalk.green('Upload successful! File is public.'));
        console.log(chalk.blue('\nIPFS Link:'), chalk.underline.white(ipfsUrl));
  
        return ipfsUrl;
      } else {
        throw new Error('Invalid or incomplete response from Lighthouse API');
      }
    } catch (error) {
      s.stop(chalk.red('Upload failed.'));
      console.error(chalk.red('Error uploading to IPFS:'), error.message);
      
      // Enhanced error logging
      if (error.response) {
        console.error(chalk.red('Lighthouse API Response:'), {
          status: error.response.status,
          data: error.response.data
        });
      }
  
      console.error(chalk.red('Full error details:'), error);
      return null;
    }
  }

  async buildProject(framework) {
    const projectPath = process.cwd();
    const s = spinner();

    try {
      // Install dependencies
      s.start('Installing dependencies...');
      execSync('npm install', { cwd: projectPath, stdio: 'ignore' });
      s.stop(chalk.green('Dependencies installed.'));

      // Build project based on framework
      const buildSpinner = spinner();
      buildSpinner.start(`Building ${framework} project...`);

      const buildCommands = {
        'Next.js': 'next build && next export',
        'React': 'npm run build',
        'Vue': 'npm run build',
        'Angular': 'ng build --output-path=dist',
        'Static': null
      };

      const buildCommand = buildCommands[framework];
      
      if (buildCommand) {
        execSync(buildCommand, { cwd: projectPath, stdio: 'ignore' });
      }
      
      buildSpinner.stop(chalk.green(`${framework} build completed.`));

      // Determine build output path
      const buildPaths = [
        path.join(projectPath, 'out'),     // Next.js
        path.join(projectPath, 'build'),   // React
        path.join(projectPath, 'dist'),    // Vue, Angular
      ];

      const buildPath = buildPaths.find(p => fs.existsSync(p));

      if (!buildPath && framework !== 'Static') {
        throw new Error('No build folder found after build process.');
      }

      return buildPath || projectPath;
    } catch (error) {
      console.error(chalk.red('\nBuild failed:'), error.message);
      process.exit(1);
    }
  }

  async findAndUploadIndexHtml(buildPath) {
    const indexCandidates = [
      path.join(buildPath, 'index.html'),
      path.join(buildPath, 'home', 'index.html'),
      path.join(buildPath, 'public', 'index.html')
    ];

    const indexPath = indexCandidates.find(p => fs.existsSync(p));

    if (!indexPath) {
      console.error(chalk.red('No index.html found in build directory.'));
      process.exit(1);
    }

    return await this.uploadToIPFS(indexPath, 'index.html');
  }

  async runDeployCLI() {
    intro(chalk.bold('Dehost Deployment CLI 🚀'));

    // Detect framework
    const framework = this.detectFramework();
     
    if (!framework) {
      console.error(chalk.red('\nNo supported framework or index.html found.'));
      outro('Deployment failed.');
      return;
    }

    console.log(chalk.blue(`\nDetected framework: ${framework}`));
     
    // Build project
    const buildPath = await this.buildProject(framework);

    // Upload index.html
    const deploymentResult = await this.findAndUploadIndexHtml(buildPath);

    if (deploymentResult) {
      outro(chalk.green(`\nDeployment completed! 🎉\nIPFS Link: ${deploymentResult}`));
    } else {
      outro(chalk.red('\nDeployment failed.'));
    }
  }
}

// Check if script is being run directly
if (import.meta.url === `file://${fileURLToPath(import.meta.url)}`) {
   const cli = new DeploymentCLI();
   cli.runDeployCLI().catch((error) => {
     console.error(chalk.red('\nUnexpected error:'), error);
     process.exit(1);
   });
}

export default DeploymentCLI;