import AuthCLI from './cli-auth.js';

const cli = new AuthCLI();
cli.runAuthCLI().catch(console.error); 