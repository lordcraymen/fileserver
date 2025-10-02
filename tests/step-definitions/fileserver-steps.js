const { Given, When, Then, Before, After } = require('@cucumber/cucumber');
const Docker = require('dockerode');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// Docker client
const docker = new Docker();

// Test context
class TestContext {
  constructor() {
    this.container = null;
    this.port = 8080;
    this.containerName = 'test-simple-fileserver';
    this.response = null;
    this.serverRunning = false;
    this.wwwDir = path.resolve('./www');
    this.testFilePath = null;
  }

  async cleanup() {
    // Clean up test files
    if (this.testFilePath) {
      try {
        await fs.remove(this.testFilePath);
      } catch (err) {
        // File might not exist, that's fine
      }
      this.testFilePath = null;
    }
    
    // Stop and remove container if it exists
    if (this.container || this.serverRunning) {
      try {
        const existingContainer = docker.getContainer(this.containerName);
        await existingContainer.stop({ t: 2 });
        await existingContainer.remove({ force: true });
      } catch (err) {
        // Container might not exist, that's fine
      }
      this.container = null;
      this.serverRunning = false;
    }
  }

  async ensureServerIsRunning() {
    if (this.serverRunning) {
      // Check if server is still responding
      try {
        await axios.get(`http://localhost:${this.port}`, { timeout: 2000 });
        return; // Server is running and responding
      } catch (err) {
        // Server not responding, restart it
        this.serverRunning = false;
      }
    }

    try {
      // Check if Docker is running
      await docker.ping();
    } catch (err) {
      throw new Error('Docker Desktop is not running. Please start Docker Desktop first.');
    }

    try {
      // Remove existing container if it exists
      await this.cleanup();

      // Start the container
      const container = await docker.createContainer({
        Image: 'lordcraymen/simple-fileserver:latest',
        name: this.containerName,
        ExposedPorts: {
          '80/tcp': {}
        },
        HostConfig: {
          PortBindings: {
            '80/tcp': [{ HostPort: this.port.toString() }]
          },
          Binds: [`${this.wwwDir}:/www:ro`]
        }
      });

      await container.start();
      this.container = container;

      // Wait for server to be ready
      let retries = 15;
      while (retries > 0) {
        try {
          await axios.get(`http://localhost:${this.port}`, { timeout: 1000 });
          this.serverRunning = true;
          break;
        } catch (err) {
          // Server not ready yet
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries--;
      }

      if (retries === 0) {
        throw new Error('Server failed to start within expected time');
      }

    } catch (error) {
      throw new Error(`Failed to start file server: ${error.message}`);
    }
  }
}

// Global test context
let testContext;

Before(async function() {
  testContext = new TestContext();
  this.testContext = testContext;
});

After({ timeout: 15000 }, async function() {
  if (testContext) {
    await testContext.cleanup();
  }
});

Given('a directory {string} exists with the file {string}', async function (directory, filename) {
  // Ensure www directory exists
  await fs.ensureDir(testContext.wwwDir);
  
  const filePath = path.join(testContext.wwwDir, filename);
  
  if (filename === 'index.html') {
    // Use existing index.html and read its content for testing
    if (await fs.pathExists(filePath)) {
      const content = await fs.readFile(filePath, 'utf8');
      // Look for a recognizable part of the content for validation
      if (content.includes('Simple File Server')) {
        testContext.testFileContent = 'Simple File Server';
      } else {
        testContext.testFileContent = 'index.html';
      }
    } else {
      // Create a simple index.html if it doesn't exist (shouldn't happen in our case)
      const content = `<html><body><h1>Simple File Server</h1></body></html>`;
      await fs.writeFile(filePath, content);
      testContext.testFileContent = 'Simple File Server';
    }
  } else {
    // For other files, create test content but use a test-specific name
    const testFileName = `test-${filename}`;
    const testFilePath = path.join(testContext.wwwDir, testFileName);
    const content = `<html><body><h1>Test content for ${testFileName}</h1></body></html>`;
    await fs.writeFile(testFilePath, content);
    testContext.testFileContent = `Test content for ${testFileName}`;
    testContext.testFilePath = testFilePath; // Store for cleanup
  }
});

Given('a directory {string} exists without the file {string}', async function (directory, filename) {
  // Ensure www directory exists
  await fs.ensureDir(testContext.wwwDir);
  
  // We'll test with a non-existent file, but don't touch existing files
  const filePath = path.join(testContext.wwwDir, filename);
  
  // Make sure the test file doesn't exist (but don't remove existing files like index.html)
  if (filename.startsWith('test-') || filename === 'non-existent.html') {
    try {
      await fs.remove(filePath);
    } catch (err) {
      // File doesn't exist, that's fine
    }
  }
  
  // Verify that index.html exists (our main file should always be there)
  const indexPath = path.join(testContext.wwwDir, 'index.html');
  if (!await fs.pathExists(indexPath)) {
    throw new Error('Expected index.html to exist in www directory');
  }
});

Given('the file server is started in the directory {string} on a port {int}', async function (directory, port) {
  await testContext.ensureServerIsRunning();
});

When('I access the URL {string} with a GET request', async function (url) {
  try {
    testContext.response = await axios.get(url, { timeout: 5000 });
    testContext.responseContent = testContext.response.data;
    testContext.statusCode = testContext.response.status;
    testContext.requestError = null;
  } catch (error) {
    testContext.response = null;
    testContext.responseContent = '';
    testContext.statusCode = error.response ? error.response.status : 0;
    testContext.requestError = error.message;
  }
});

Then('I should see the content of the file {string}', async function (filename) {
  if (testContext.statusCode !== 200) {
    throw new Error(`Expected 200 OK, got ${testContext.statusCode}`);
  }
  
  if (!testContext.responseContent.includes(testContext.testFileContent)) {
    throw new Error(`Expected content '${testContext.testFileContent}' not found in response`);
  }
});

Then('I should see a 404 error message', async function () {
  if (testContext.statusCode !== 404) {
    throw new Error(`Expected 404 Not Found, got ${testContext.statusCode}`);
  }
});