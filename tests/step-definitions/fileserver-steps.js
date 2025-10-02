const { Given, When, Then, Before, After } = require('@cucumber/cucumber');
const Docker = require('dockerode');
const axios = require('axios');
const fs = require('fs-extra');
const tmp = require('tmp');
const path = require('path');

// Docker client
const docker = new Docker();

// Test context
class TestContext {
  constructor() {
    this.container = null;
    this.testDir = null;
    this.port = null;
    this.containerName = `test-simple-fileserver-${Date.now()}`;
    this.response = null;
    this.testFileContent = null;
  }

  async cleanup() {
    // Stop and remove container
    if (this.container) {
      try {
        await this.container.stop({ t: 1 }); // Force stop after 1 second
        await this.container.remove({ force: true });
      } catch (err) {
        console.log(`Cleanup error: ${err.message}`);
      }
      this.container = null;
    }

    // Clean up test directory
    if (this.testDir) {
      try {
        await fs.remove(this.testDir);
      } catch (err) {
        console.log(`Directory cleanup error: ${err.message}`);
      }
      this.testDir = null;
    }
  }
}

// Global test context
let testContext;

Before(async function() {
  testContext = new TestContext();
  this.testContext = testContext;
});

After(async function() {
  if (testContext) {
    await testContext.cleanup();
  }
});

Given('a directory {string} exists with the file {string}', async function (directory, filename) {
  // Create temporary directory
  testContext.testDir = tmp.dirSync({ unsafeCleanup: true }).name;
  const wwwDir = path.join(testContext.testDir, directory);
  await fs.ensureDir(wwwDir);
  
  // Create test file
  const filePath = path.join(wwwDir, filename);
  const content = `<html><body><h1>Test content for ${filename}</h1></body></html>`;
  await fs.writeFile(filePath, content);
  
  testContext.testFileContent = `Test content for ${filename}`;
});

Given('a directory {string} exists without the file {string}', async function (directory, filename) {
  // Create temporary directory
  testContext.testDir = tmp.dirSync({ unsafeCleanup: true }).name;
  const wwwDir = path.join(testContext.testDir, directory);
  await fs.ensureDir(wwwDir);
  
  // Create a different file to ensure directory is not empty
  const otherFile = path.join(wwwDir, 'other.html');
  await fs.writeFile(otherFile, '<html><body>Other file</body></html>');
});

Given('the file server is started in the directory {string} on port {int}', async function (directory, port) {
  testContext.port = port;
  
  // Build volume mount path - ensure Windows path compatibility
  const hostPath = path.resolve(path.join(testContext.testDir, directory)).replace(/\\/g, '/');
  const containerPath = '/www';
  
  try {
    // Remove existing container if it exists
    try {
      const existingContainer = docker.getContainer(testContext.containerName);
      await existingContainer.stop();
      await existingContainer.remove();
    } catch (err) {
      // Container doesn't exist, that's fine
    }
    
    // Create and start container
    const container = await docker.createContainer({
      Image: 'lordcraymen/simple-fileserver:latest',
      name: testContext.containerName,
      ExposedPorts: {
        '80/tcp': {}
      },
      HostConfig: {
        PortBindings: {
          '80/tcp': [{ HostPort: port.toString() }]
        },
        Binds: [`${hostPath}:${containerPath}:ro`]
      }
    });
    
    await container.start();
    testContext.container = container;
    
    // Wait longer for container to be ready and do health check
    let retries = 10;
    while (retries > 0) {
      try {
        const containerInfo = await container.inspect();
        if (containerInfo.State.Status === 'running') {
          // Test if the server is responding
          await axios.get(`http://localhost:${port}`, { timeout: 1000 });
          break;
        }
      } catch (err) {
        // Server not ready yet, wait and retry
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      retries--;
    }
    
    if (retries === 0) {
      const containerInfo = await container.inspect();
      throw new Error(`Container failed to become ready: ${containerInfo.State.Status}`);
    }
    
  } catch (error) {
    throw new Error(`Failed to start file server: ${error.message}`);
  }
});

Given('the file server is running in the directory {string} on port {int}', async function (directory, port) {
  // Create directory with file first
  testContext.testDir = tmp.dirSync({ unsafeCleanup: true }).name;
  const wwwDir = path.join(testContext.testDir, directory);
  await fs.ensureDir(wwwDir);
  
  // Create test file
  const filePath = path.join(wwwDir, 'index.html');
  const content = `<html><body><h1>Test content for index.html</h1></body></html>`;
  await fs.writeFile(filePath, content);
  
  testContext.testFileContent = `Test content for index.html`;
  
  // Start the server
  testContext.port = port;
  
  // Build volume mount path - ensure Windows path compatibility
  const hostPath = path.resolve(path.join(testContext.testDir, directory)).replace(/\\/g, '/');
  const containerPath = '/www';
  
  try {
    // Remove existing container if it exists
    try {
      const existingContainer = docker.getContainer(testContext.containerName);
      await existingContainer.stop();
      await existingContainer.remove();
    } catch (err) {
      // Container doesn't exist, that's fine
    }
    
    // Create and start container
    const container = await docker.createContainer({
      Image: 'lordcraymen/simple-fileserver:latest',
      name: testContext.containerName,
      ExposedPorts: {
        '80/tcp': {}
      },
      HostConfig: {
        PortBindings: {
          '80/tcp': [{ HostPort: port.toString() }]
        },
        Binds: [`${hostPath}:${containerPath}:ro`]
      }
    });
    
    await container.start();
    testContext.container = container;
    
    // Wait longer for container to be ready and do health check
    let retries = 10;
    while (retries > 0) {
      try {
        const containerInfo = await container.inspect();
        if (containerInfo.State.Status === 'running') {
          // Test if the server is responding
          await axios.get(`http://localhost:${port}`, { timeout: 1000 });
          break;
        }
      } catch (err) {
        // Server not ready yet, wait and retry
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      retries--;
    }
    
    if (retries === 0) {
      const containerInfo = await container.inspect();
      throw new Error(`Container failed to become ready: ${containerInfo.State.Status}`);
    }
    
  } catch (error) {
    throw new Error(`Failed to start file server: ${error.message}`);
  }
});

When('I access the URL {string} in the browser', async function (url) {
  try {
    testContext.response = await axios.get(url, { timeout: 10000 });
    testContext.responseContent = testContext.response.data;
    testContext.statusCode = testContext.response.status;
  } catch (error) {
    testContext.response = null;
    testContext.responseContent = '';
    testContext.statusCode = error.response ? error.response.status : 0;
    testContext.requestError = error.message;
  }
});

When('I stop the file server', async function () {
  if (testContext.container) {
    await testContext.container.stop();
    testContext.container = null;
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

Then('the server should no longer be accessible at {string}', async function (url) {
  try {
    const response = await axios.get(url, { timeout: 5000 });
    // If we get here, the server is still running
    throw new Error(`Server is still accessible (status: ${response.status})`);
  } catch (error) {
    // This is expected - server should be inaccessible
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      // Good, server is not accessible
      return;
    }
    // Re-throw unexpected errors
    throw error;
  }
});