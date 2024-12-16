import { intro, outro, spinner, confirm } from '@clack/prompts';
import open from 'open';
import http from 'http';
import process from 'process';
import fetch from 'node-fetch';  // To send HTTP requests

class AuthCLI {
  constructor() {
    this.server = null;
    this.authPromise = null;
  }

  startCallbackServer() {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        const url = new URL(req.url, `http://${req.headers.host}`);

        // Handle only the callback endpoint
        if (url.pathname === '/auth/callback') {
          const status = url.searchParams.get('status');
          res.writeHead(200, { 'Content-Type': 'text/html' });
          if (status === 'success') {
            res.end('<h1>Login successful! You can close this tab.</h1>');
            console.log('User login was successful.');
            resolve('success');
          } else {
            res.end('<h1>Login failed! Please try again.</h1>');
            console.error('Login failed.');
            reject(new Error('Login failed.'));
          }
        } else {
          // Return 404 for any other route
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
        }
      });

      this.server.listen(4000, () => {
        console.log('Callback server running on http://localhost:4000');
      });

      // Handle server errors
      this.server.on('error', (err) => {
        console.error('Server error:', err);
        reject(err);
      });
    });
  }

  setupExitHandlers() {
    ['SIGINT', 'SIGTERM'].forEach((signal) => {
      process.on(signal, async () => {
        console.log(`\nReceived ${signal}. Shutting down gracefully...`);
        await this.cleanUp();
      });
    });
  }

  async cleanUp() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close((err) => {
          if (err) {
            console.error('Error closing server:', err);
          }
          resolve();
          process.exit(0);
        });
      });
    }
    process.exit(0);
  }

  async generateCode() {
    // Generate a random 6-digit numeric code
    const code = Math.floor(100000 + Math.random() * 900000);
    return code.toString();
  }

  async sendCodeToBackend(code) {
    try {
      const response = await fetch('http://localhost:3000/api/save-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
  
      const responseBody = await response.text();
  
      if (!response.ok) {
        throw new Error(`Failed to send code. Status: ${response.status}`);
      }
      console.log('Code sent to the backend successfully.');
    } catch (error) {
      console.error('Error details:', error);
      throw error;
    }
  }

  async runAuthCLI() {
    this.setupExitHandlers();

    intro('Welcome to Dehost CLI 🚀');

    const shouldProceed = await confirm({
      message: 'This will open your browser for login. Proceed?',
    });

    if (!shouldProceed) {
      outro('Authentication cancelled. See you later!');
      await this.cleanUp();
      return;
    }

    const sp = spinner();
    sp.start('Generating login code...');

    try {
      // Step 1: Generate a 6-digit code
      const code = await this.generateCode();
      console.log(`Generated code: ${code}`);

      // Step 2: Send the code to the backend
      await this.sendCodeToBackend(code);

      sp.stop('Code generated and sent successfully!');

      // Step 3: Start the callback server
      this.authPromise = this.startCallbackServer();

      // Step 4: Open browser with the code attached as a query parameter
      const authURL = `http://localhost:3000/cliauth`;
      console.log(`Opening browser to: ${authURL}`);
      await open(authURL);

      console.log('Waiting for confirmation from the website...');

      // Step 5: Wait for the callback with login status
      const loginStatus = await Promise.race([
        this.authPromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Authentication timed out')), 60000)
        ),
      ]);

      if (loginStatus === 'success') {
        outro('Authentication successful! You are now logged in. 🎉');
      } else {
        throw new Error('Authentication failed.');
      }
    } catch (error) {
      sp.stop('Authentication failed');
      console.error('Error:', error.message);
    } finally {
      await this.cleanUp();
    }
  }
}

// Run the CLI
const cli = new AuthCLI();
cli.runAuthCLI().catch(console.error);
