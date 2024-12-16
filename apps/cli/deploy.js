import { intro, outro, spinner } from '@clack/prompts';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import chalk from 'chalk';
import process from 'process';

export class DeploymentCLI {
  // Framework Detection Method
  detectFramework() {
    const projectPath = process.cwd();
    const packageJsonPath = path.join(projectPath, 'package.json');

    try {
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
      return 'Vanilla';
    } catch (error) {
      if (fs.existsSync(path.join(projectPath, 'index.html'))) {
        return 'Vanilla';
      }
      return null;
    }
  }

  // Deployment Method
  deployProject(framework) {
    const projectPath = process.cwd();
    const sp = spinner();

    try {
      sp.start(`Building the ${framework} project...`);

      // Framework-specific build commands
      switch (framework) {
        case 'Next.js':
        case 'React':
        case 'Vue':
          execSync('npm install', { cwd: projectPath, stdio: 'inherit' });
          execSync('npm run build', { cwd: projectPath, stdio: 'inherit' });
          break;
        case 'Vanilla':
          execSync('zip -r dist.zip .', { cwd: projectPath, stdio: 'inherit' });
          break;
      }

      sp.stop(`${framework} project built successfully!`);
      console.log(chalk.green(`✓ ${framework} project is ready for deployment.`));
    } catch (error) {
      sp.stop('Build failed');
      console.error(chalk.red('Build error:'), error);
    }
  }

  // Main CLI Logic
  async runDeployCLI() {
    intro('Dehost Deployment CLI 🚀');

    const framework = this.detectFramework();
    if (!framework) {
      console.error(chalk.red('No supported framework detected.'));
      outro('Deployment failed.');
      return;
    }

    console.log(chalk.blue(`Detected framework: ${framework}`));
    this.deployProject(framework);

    outro(`${framework} project deployment process completed! 🎉`);
  }
}

// Execute the CLI
const cli = new DeploymentCLI();
cli.runDeployCLI().catch(console.error);

export default DeploymentCLI;
