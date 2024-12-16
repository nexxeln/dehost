import { intro, outro, spinner } from '@clack/prompts';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import chalk from 'chalk';
import process from 'process';

export class DeploymentCLI {
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

  async deployProject(framework) {
    const projectPath = process.cwd();

    try {
      // Install dependencies
      const s = spinner();
      s.start('Installing dependencies...');
      try {
        execSync('npm install', { 
          cwd: projectPath,
          stdio: 'ignore' 
        });
        s.stop(chalk.green('Dependencies installed'));
      } catch (error) {
        s.stop(chalk.red('Failed to install dependencies'));
        throw error;
      }

      // Build project
      const buildSpinner = spinner();
      buildSpinner.start(`Building ${framework} project...`);
      try {
        execSync('npm run build', { 
          cwd: projectPath,
          stdio: 'ignore' 
        });
        buildSpinner.stop(chalk.green(`${framework} build completed`));
      } catch (error) {
        buildSpinner.stop(chalk.red('Build failed'));
        throw error;
      }

      // Package vanilla project if applicable
      if (framework === 'Vanilla') {
        const packageSpinner = spinner();
        packageSpinner.start('Packaging vanilla project...');
        try {
          execSync('zip -r dist.zip .', { 
            cwd: projectPath,
            stdio: 'ignore' 
          });
          packageSpinner.stop(chalk.green('Project packaged successfully'));
        } catch (error) {
          packageSpinner.stop(chalk.red('Packaging failed'));
          throw error;
        }
      }

      console.log(chalk.green(`\n✓ ${framework} project is ready for deployment.`));
    } catch (error) {
      console.error(chalk.red('\nError during deployment:'), error.message);
      process.exit(1);
    }
  }

  async runDeployCLI() {
    intro(chalk.bold('Dehost Deployment CLI 🚀'));

    const framework = this.detectFramework();
    if (!framework) {
      console.error(chalk.red('\nNo supported framework detected.'));
      outro('Deployment failed.');
      return;
    }

    console.log(chalk.blue(`\nDetected framework: ${framework}`));
    await this.deployProject(framework);

    outro(chalk.green(`\n${framework} project deployment process completed! 🎉`));
  }
}

// Only execute if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new DeploymentCLI();
  cli.runDeployCLI().catch(error => {
    console.error(chalk.red('\nUnexpected error:'), error);
    process.exit(1);
  });
}

export default DeploymentCLI;